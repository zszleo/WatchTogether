package com.watchtogether.handler;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.watchtogether.utils.RedisUtil;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import com.watchtogether.model.Room;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.watchtogether.dto.event.JoinRoomEvent;
import com.watchtogether.dto.event.LeaveRoomEvent;
import com.watchtogether.dto.event.VideoPlayEvent;
import com.watchtogether.dto.event.VideoPauseEvent;
import com.watchtogether.dto.event.VideoSeekEvent;
import com.watchtogether.dto.event.VideoUrlChangeEvent;
import com.watchtogether.dto.event.ChatMessageEvent;

@Component
public class SocketEventHandler {

    private static final Logger logger = LoggerFactory.getLogger(SocketEventHandler.class);

    private final SocketIOServer socketServer;
    private final RedisUtil redisUtil;
    private final RoomService roomService;
    private final SessionService sessionService;

    @Autowired
    public SocketEventHandler(SocketIOServer socketServer, RedisUtil redisUtil,
                             RoomService roomService, SessionService sessionService) {
        this.socketServer = socketServer;
        this.redisUtil = redisUtil;
        this.roomService = roomService;
        this.sessionService = sessionService;
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String socketId = client.getSessionId().toString();
        logger.info("Client connected: {}", socketId);
        
        // Store socket connection mapping
        Map<String, String> socketMapping = new HashMap<>();
        socketMapping.put("socketId", socketId);
        socketMapping.put("connectedAt", String.valueOf(System.currentTimeMillis()));
        redisUtil.set(RedisUtil.KEY_PREFIX_SOCKET + socketId, socketMapping, RedisUtil.TTL_SESSION);
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        String socketId = client.getSessionId().toString();
        logger.info("Client disconnected: {}", socketId);
        
        // Remove socket mapping
        redisUtil.delete(RedisUtil.KEY_PREFIX_SOCKET + socketId);
        
        // Handle user leaving room if they were in one
        // Get socket mapping from Redis to get sessionId and room info
        Map<String, String> socketMapping = redisUtil.get(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId, Map.class);
        if (socketMapping != null) {
            String sessionId = socketMapping.get("sessionId");
            String roomCode = socketMapping.get("roomCode");
            String roomIdStr = socketMapping.get("roomId");
            
            if (roomCode != null) {
                // Broadcast user left to room
                Map<String, Object> leaveEvent = new HashMap<>();
                leaveEvent.put("socketId", socketId);
                leaveEvent.put("sessionId", sessionId);
                leaveEvent.put("timestamp", System.currentTimeMillis());
                socketServer.getRoomOperations(roomCode).sendEvent("user-left", leaveEvent);
                
                // Remove user from room users in Redis
                if (roomIdStr != null && sessionId != null) {
                    removeUserFromRoom(roomIdStr, sessionId);
                }
                
                // Update session to leave room
                if (sessionId != null) {
                    sessionService.leaveRoom(sessionId);
                }
                
                // Update room activity
                if (roomIdStr != null) {
                    try {
                        Long roomId = Long.parseLong(roomIdStr);
                        roomService.updateRoomActivity(roomId);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid room ID format: {}", roomIdStr);
                    }
                }
            }
            
            // Remove the session socket mapping
            redisUtil.delete(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId);
        }
    }

    @OnEvent("join-room")
    public void onJoinRoom(SocketIOClient client, JoinRoomEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomCode = data.getRoomId();
        String sessionId = data.getSessionId();
        
        logger.info("Client {} joining room {} with session {}", socketId, roomCode, sessionId);
        
        if (roomCode == null || roomCode.trim().isEmpty()) {
            if (ackSender.isAckRequested()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Room ID is required");
                ackSender.sendAckData(error);
            }
            return;
        }
        
        // Validate session
        if (sessionId == null || !sessionService.validateSession(sessionId)) {
            if (ackSender.isAckRequested()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid session");
                ackSender.sendAckData(error);
            }
            return;
        }
        
        // Find room by code
        Optional<Room> roomOpt = roomService.getRoomByCode(roomCode);
        if (roomOpt.isEmpty()) {
            if (ackSender.isAckRequested()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Room not found");
                ackSender.sendAckData(error);
            }
            return;
        }
        
        Room room = roomOpt.get();
        Long roomId = room.getId();
        String roomIdStr = roomId.toString();
        
        // Join the socket.io room (using room code as room name)
        client.joinRoom(roomCode);
        
        // Update session with room ID
        sessionService.joinRoom(sessionId, roomId);
        
        // Update socket mapping with room info
        Map<String, String> socketMapping = new HashMap<>();
        socketMapping.put("socketId", socketId);
        socketMapping.put("roomCode", roomCode);
        socketMapping.put("roomId", roomIdStr);
        socketMapping.put("sessionId", sessionId);
        redisUtil.set(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId, socketMapping, RedisUtil.TTL_SESSION);
        
        // Add user to room users set in Redis
        addUserToRoom(roomIdStr, sessionId, socketId);
        
        // Update room activity
        roomService.updateRoomActivity(roomId);
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("roomId", roomCode);
            response.put("roomInfo", Map.of(
                "id", roomId,
                "code", room.getCode(),
                "name", room.getName(),
                "videoUrl", room.getVideoUrl(),
                "videoTitle", room.getVideoTitle(),
                "currentPlaybackTime", room.getCurrentPlaybackTime(),
                "isPlaying", room.getIsPlaying()
            ));
            ackSender.sendAckData(response);
        }
        
        // Broadcast user joined to room
        Map<String, Object> joinEvent = new HashMap<>();
        joinEvent.put("socketId", socketId);
        joinEvent.put("sessionId", sessionId);
        joinEvent.put("timestamp", System.currentTimeMillis());
        socketServer.getRoomOperations(roomCode).sendEvent("user-joined", joinEvent);
        
        // Send room state to the newly joined client only
        sendRoomState(client, room, roomCode);
    }

    @OnEvent("leave-room")
    public void onLeaveRoom(SocketIOClient client, LeaveRoomEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomCode = data.getRoomId();
        
        logger.info("Client {} leaving room {}", socketId, roomCode);
        
        // Get socket mapping from Redis to get sessionId and roomId
        Map<String, String> socketMapping = redisUtil.get(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId, Map.class);
        if (socketMapping == null) {
            socketMapping = new HashMap<>();
        }
        
        String sessionId = socketMapping.get("sessionId");
        String storedRoomCode = socketMapping.get("roomCode");
        String roomIdStr = socketMapping.get("roomId");
        
        // Validate that the client is leaving the correct room
        if (roomCode != null && !roomCode.trim().isEmpty() && storedRoomCode != null && storedRoomCode.equals(roomCode)) {
            // Leave the socket.io room
            client.leaveRoom(roomCode);
            
            // Broadcast user left to room
            Map<String, Object> leaveEvent = new HashMap<>();
            leaveEvent.put("socketId", socketId);
            leaveEvent.put("sessionId", sessionId);
            leaveEvent.put("timestamp", System.currentTimeMillis());
            socketServer.getRoomOperations(roomCode).sendEvent("user-left", leaveEvent);
            
            // Remove user from room users in Redis
            if (roomIdStr != null && sessionId != null) {
                removeUserFromRoom(roomIdStr, sessionId);
            }
            
            // Update session to leave room
            if (sessionId != null) {
                sessionService.leaveRoom(sessionId);
            }
            
            // Update room activity
            if (roomIdStr != null) {
                try {
                    Long roomId = Long.parseLong(roomIdStr);
                    roomService.updateRoomActivity(roomId);
                } catch (NumberFormatException e) {
                    logger.warn("Invalid room ID format: {}", roomIdStr);
                }
            }
        }
        
        // Update socket mapping to remove room info
        Map<String, String> updatedMapping = new HashMap<>();
        updatedMapping.put("socketId", socketId);
        updatedMapping.put("connectedAt", String.valueOf(System.currentTimeMillis()));
        redisUtil.set(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId, updatedMapping, RedisUtil.TTL_SESSION);
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }

    @OnEvent("video:play")
    public void onVideoPlay(SocketIOClient client, VideoPlayEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomId = data.getRoomId();
        Double time = data.getTime();
        
        logger.info("Video play in room {} at time {} from client {}", roomId, time, socketId);
        
        if (roomId != null && !roomId.trim().isEmpty()) {
            // Store playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("playing", true);
            playbackState.put("time", time != null ? time : 0.0);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomId, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("playing", true);
            syncEvent.put("time", time != null ? time : 0.0);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-play", syncEvent, client);
        }
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }

    @OnEvent("video:pause")
    public void onVideoPause(SocketIOClient client, VideoPauseEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomId = data.getRoomId();
        
        logger.info("Video pause in room {} from client {}", roomId, socketId);
        
        if (roomId != null && !roomId.trim().isEmpty()) {
            // Store playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("playing", false);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomId, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("playing", false);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-pause", syncEvent, client);
        }
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }

    @OnEvent("video:seek")
    public void onVideoSeek(SocketIOClient client, VideoSeekEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomId = data.getRoomId();
        Double time = data.getTime();
        
        logger.info("Video seek in room {} to time {} from client {}", roomId, time, socketId);
        
        if (roomId != null && !roomId.trim().isEmpty() && time != null) {
            // Update playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("time", time);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomId, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("time", time);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-seek", syncEvent, client);
        }
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }

    @OnEvent("video:url-change")
    public void onVideoUrlChange(SocketIOClient client, VideoUrlChangeEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomId = data.getRoomId();
        String url = data.getUrl();
        
        logger.info("Video URL change in room {} to {} from client {}", roomId, url, socketId);
        
        if (roomId != null && !roomId.trim().isEmpty() && url != null) {
            // Store room video URL in Redis
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("videoUrl", url);
            roomData.put("updatedBy", socketId);
            roomData.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoom(roomId, roomData);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("url", url);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-url-change", syncEvent, client);
        }
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }

    @OnEvent("chat:message")
    public void onChatMessage(SocketIOClient client, ChatMessageEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomId = data.getRoomId();
        String message = data.getMessage();
        String sender = data.getSender();
        
        logger.info("Chat message in room {} from {}: {}", roomId, sender, message);
        
        if (roomId != null && !roomId.trim().isEmpty() && message != null && !message.trim().isEmpty()) {
            // TODO: Save message to database
            // For now, just broadcast
            
            Map<String, Object> chatEvent = new HashMap<>();
            chatEvent.put("message", message);
            chatEvent.put("sender", sender != null ? sender : "Anonymous");
            chatEvent.put("socketId", socketId);
            chatEvent.put("timestamp", System.currentTimeMillis());
            
            // Broadcast to all clients in room (including sender)
            socketServer.getRoomOperations(roomId).sendEvent("chat:message", chatEvent);
        }
        
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }
    
    private void addUserToRoom(String roomId, String sessionId, String socketId) {
        // Get current users set from Redis
        Object usersObj = redisUtil.getRoomUsers(roomId);
        Map<String, Object> usersData = null;
        if (usersObj instanceof Map) {
            usersData = (Map<String, Object>) usersObj;
        }
        if (usersData == null) {
            usersData = new HashMap<>();
        }
        
        // Add user to the set
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("sessionId", sessionId);
        userInfo.put("socketId", socketId);
        userInfo.put("joinedAt", System.currentTimeMillis());
        
        usersData.put(sessionId, userInfo);
        
        // Save back to Redis
        redisUtil.setRoomUsers(roomId, usersData);
    }
    
    private void removeUserFromRoom(String roomId, String sessionId) {
        Object usersObj = redisUtil.getRoomUsers(roomId);
        if (usersObj instanceof Map) {
            Map<String, Object> usersData = (Map<String, Object>) usersObj;
            usersData.remove(sessionId);
            redisUtil.setRoomUsers(roomId, usersData);
        }
    }
    
    private void sendRoomState(SocketIOClient client, Room room, String roomCode) {
        Map<String, Object> roomState = new HashMap<>();
        roomState.put("roomId", room.getId());
        roomState.put("code", room.getCode());
        roomState.put("name", room.getName());
        roomState.put("videoUrl", room.getVideoUrl());
        roomState.put("videoTitle", room.getVideoTitle());
        roomState.put("currentPlaybackTime", room.getCurrentPlaybackTime());
        roomState.put("isPlaying", room.getIsPlaying());
        roomState.put("updatedAt", room.getUpdatedAt());
        
        // Get online users
        Object usersObj = redisUtil.getRoomUsers(room.getId().toString());
        if (usersObj instanceof Map) {
            Map<String, Object> usersData = (Map<String, Object>) usersObj;
            roomState.put("onlineUsers", usersData.keySet().size());
            roomState.put("userList", usersData.values());
        } else {
            roomState.put("onlineUsers", 0);
            roomState.put("userList", new ArrayList<>());
        }
        
        client.sendEvent("room-state", roomState);
    }
}