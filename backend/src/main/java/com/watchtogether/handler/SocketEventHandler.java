package com.watchtogether.handler;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.watchtogether.utils.RedisUtil;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;

import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import com.watchtogether.model.Room;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.dto.event.JoinRoomEvent;
import com.watchtogether.dto.event.LeaveRoomEvent;
import com.watchtogether.dto.event.VideoPlayEvent;
import com.watchtogether.dto.event.VideoPauseEvent;
import com.watchtogether.dto.event.VideoSeekEvent;
import com.watchtogether.dto.event.VideoUrlChangeEvent;
import com.watchtogether.dto.event.ChatMessageEvent;

@Slf4j
@Component
public class SocketEventHandler {

    @Resource
    public SocketIOServer socketServer;
    @Resource
    public RedisUtil redisUtil;
    @Resource
    public RoomService roomService;
    @Resource
    public SessionService sessionService;
    @Resource
    public ChatMessageRepository chatMessageRepository;

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String socketId = client.getSessionId().toString();
        log.info("Client connected: {}", socketId);
        
        // Store socket connection mapping
        Map<String, String> socketMapping = new HashMap<>();
        socketMapping.put("socketId", socketId);
        socketMapping.put("connectedAt", String.valueOf(System.currentTimeMillis()));
        redisUtil.set(RedisUtil.KEY_PREFIX_SOCKET + socketId, socketMapping, RedisUtil.TTL_SESSION);
    }

    @OnDisconnect
    @Transactional
    public void onDisconnect(SocketIOClient client) {
        String socketId = client.getSessionId().toString();
        log.info("Client disconnected: {}", socketId);
        
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
                
                // Send system message for user disconnected
                String nickname = sessionService.getSession(sessionId)
                        .map(s -> s.getNickname())
                        .orElse("Unknown User");
                Map<String, Object> systemMessage = new HashMap<>();
                systemMessage.put("type", "user-disconnected");
                systemMessage.put("content", nickname + " 断开了连接");
                systemMessage.put("roomId", roomCode);
                systemMessage.put("timestamp", System.currentTimeMillis());
                socketServer.getRoomOperations(roomCode).sendEvent("system:message", systemMessage);
                
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
                        log.warn("Invalid room ID format: {}", roomIdStr);
                    }
                }
            }
            
            // Remove the session socket mapping
            redisUtil.delete(RedisUtil.KEY_PREFIX_SESSION + "socket:" + socketId);
        }
    }

    @OnEvent("join-room")
    @Transactional
    public void onJoinRoom(SocketIOClient client, JoinRoomEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomCode = data.getRoomCode();
        String sessionId = data.getSessionId();
        
        log.info("Client {} joining room {} with session {}", socketId, roomCode, sessionId);
        
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
            Map<String, Object> roomInfo = new HashMap<>();
            roomInfo.put("id", roomId);
            roomInfo.put("code", room.getCode());
            roomInfo.put("name", room.getName());
            roomInfo.put("videoUrl", room.getVideoUrl());
            roomInfo.put("videoTitle", room.getVideoTitle());
            roomInfo.put("currentPlaybackTime", room.getCurrentPlaybackTime());
            roomInfo.put("isPlaying", room.getIsPlaying());
            response.put("roomInfo", roomInfo);
            ackSender.sendAckData(response);
        }
        
        // Broadcast user joined to room
        Map<String, Object> joinEvent = new HashMap<>();
        joinEvent.put("socketId", socketId);
        joinEvent.put("sessionId", sessionId);
        joinEvent.put("timestamp", System.currentTimeMillis());
        socketServer.getRoomOperations(roomCode).sendEvent("user-joined", joinEvent);
        
        // Send system message for user joined
        String nickname = sessionService.getSession(sessionId)
                .map(s -> s.getNickname())
                .orElse("Unknown User");
        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("type", "user-joined");
        systemMessage.put("content", nickname + " 加入了房间");
        systemMessage.put("roomId", roomCode);
        systemMessage.put("timestamp", System.currentTimeMillis());
        socketServer.getRoomOperations(roomCode).sendEvent("system:message", systemMessage);
        
        // Send room state to the newly joined client only
        sendRoomState(client, room, roomCode);
    }

    @OnEvent("leave-room")
    @Transactional
    public void onLeaveRoom(SocketIOClient client, LeaveRoomEvent data, AckRequest ackSender) {
        String socketId = client.getSessionId().toString();
        String roomCode = data.getRoomCode();
        
        log.info("Client {} leaving room {}", socketId, roomCode);
        
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
            
            // Send system message for user left
            String nickname = sessionService.getSession(sessionId)
                    .map(s -> s.getNickname())
                    .orElse("Unknown User");
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("type", "user-left");
            systemMessage.put("content", nickname + " 离开了房间");
            systemMessage.put("roomId", roomCode);
            systemMessage.put("timestamp", System.currentTimeMillis());
            socketServer.getRoomOperations(roomCode).sendEvent("system:message", systemMessage);
            
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
                    log.warn("Invalid room ID format: {}", roomIdStr);
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
        String roomCode = data.getRoomCode();
        Double time = data.getTime();
        
        log.info("Video play in room {} at time {} from client {}", roomCode, time, socketId);
        
        if (roomCode != null && !roomCode.trim().isEmpty()) {
            // Store playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("playing", true);
            playbackState.put("time", time != null ? time : 0.0);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomCode, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("playing", true);
            syncEvent.put("time", time != null ? time : 0.0);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            // Use socketServer to broadcast to room, excluding sender
            socketServer.getRoomOperations(roomCode).getClients().forEach(c -> {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("video:sync-play", syncEvent);
                }
            });
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
        String roomCode = data.getRoomCode();
        
        log.info("Video pause in room {} from client {}", roomCode, socketId);
        
        if (roomCode != null && !roomCode.trim().isEmpty()) {
            // Store playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("playing", false);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomCode, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("playing", false);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            socketServer.getRoomOperations(roomCode).getClients().forEach(c -> {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("video:sync-pause", syncEvent);
                }
            });
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
        String roomCode = data.getRoomCode();
        Double time = data.getTime();
        
        log.info("Video seek in room {} to time {} from client {}", roomCode, time, socketId);
        
        if (roomCode != null && !roomCode.trim().isEmpty() && time != null) {
            // Update playback state in Redis
            Map<String, Object> playbackState = new HashMap<>();
            playbackState.put("time", time);
            playbackState.put("updatedBy", socketId);
            playbackState.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoomPlayback(roomCode, playbackState);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("time", time);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            socketServer.getRoomOperations(roomCode).getClients().forEach(c -> {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("video:sync-seek", syncEvent);
                }
            });
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
        String roomCode = data.getRoomCode();
        String url = data.getUrl();
        
        log.info("Video URL change in room {} to {} from client {}", roomCode, url, socketId);
        
        if (roomCode != null && !roomCode.trim().isEmpty() && url != null) {
            // Store room video URL in Redis
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("videoUrl", url);
            roomData.put("updatedBy", socketId);
            roomData.put("updatedAt", System.currentTimeMillis());
            redisUtil.setRoom(roomCode, roomData);
            
            // Broadcast to all clients in room except sender
            Map<String, Object> syncEvent = new HashMap<>();
            syncEvent.put("url", url);
            syncEvent.put("updatedBy", socketId);
            syncEvent.put("timestamp", System.currentTimeMillis());
            
            socketServer.getRoomOperations(roomCode).getClients().forEach(c -> {
                if (!c.getSessionId().equals(client.getSessionId())) {
                    c.sendEvent("video:sync-url-change", syncEvent);
                }
            });
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
        String roomCode = data.getRoomCode();
        String message = data.getMessage();
        String sender = data.getSender();
        
        log.info("Chat message in room {} from {}: {}", roomCode, sender, message);
        
        if (roomCode == null || roomCode.trim().isEmpty()) {
            sendAckError(ackSender, "Room ID is required");
            return;
        }
        
        if (message == null || message.trim().isEmpty()) {
            sendAckError(ackSender, "Message cannot be empty");
            return;
        }
        
        if (message.length() > 1000) {
            sendAckError(ackSender, "Message too long (max 1000 characters)");
            return;
        }
        
        try {
            // Find room by code to get roomId
            Optional<Room> roomOpt = roomService.getRoomByCode(roomCode);
            if (roomOpt.isEmpty()) {
                sendAckError(ackSender, "Room not found");
                return;
            }
            Room room = roomOpt.get();
            
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setRoomId(room.getId());
            chatMessage.setSessionId(socketId);
            chatMessage.setContent(message);
            chatMessage.setMessageType("text");
            chatMessage = chatMessageRepository.save(chatMessage);
            
            Map<String, Object> chatEvent = new HashMap<>();
            chatEvent.put("id", chatMessage.getId());
            chatEvent.put("message", message);
            chatEvent.put("sender", sender != null ? sender : "Anonymous");
            chatEvent.put("socketId", socketId);
            chatEvent.put("timestamp", chatMessage.getCreatedAt() != null ? chatMessage.getCreatedAt().toString() : null);
            
            socketServer.getRoomOperations(roomCode).sendEvent("chat:message", chatEvent);
            
            sendAckSuccess(ackSender, new HashMap<>());
        } catch (Exception e) {
            log.error("Failed to save chat message: {}", e.getMessage());
            sendAckError(ackSender, "Failed to save message");
        }
    }
    
    public void sendAckError(AckRequest ackSender, String message) {
        if (ackSender.isAckRequested()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", message);
            ackSender.sendAckData(error);
        }
    }
    
    public void sendAckSuccess(AckRequest ackSender, Map<String, Object> data) {
        if (ackSender.isAckRequested()) {
            Map<String, Object> response = new HashMap<>(data);
            response.put("success", true);
            ackSender.sendAckData(response);
        }
    }
    
    public void addUserToRoom(String roomId, String sessionId, String socketId) {
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
    
    public void removeUserFromRoom(String roomId, String sessionId) {
        Object usersObj = redisUtil.getRoomUsers(roomId);
        if (usersObj instanceof Map) {
            Map<String, Object> usersData = (Map<String, Object>) usersObj;
            usersData.remove(sessionId);
            redisUtil.setRoomUsers(roomId, usersData);
        }
    }
    
    public void sendRoomState(SocketIOClient client, Room room, String roomCode) {
        Map<String, Object> roomState = new HashMap<>();
        roomState.put("roomId", room.getId());
        roomState.put("code", room.getCode());
        roomState.put("name", room.getName());
        roomState.put("videoUrl", room.getVideoUrl());
        roomState.put("videoTitle", room.getVideoTitle());
        roomState.put("currentPlaybackTime", room.getCurrentPlaybackTime());
        roomState.put("isPlaying", room.getIsPlaying());
        // Convert LocalDateTime to ISO string for JSON serialization
        roomState.put("updatedAt", room.getUpdatedAt() != null ? room.getUpdatedAt().toString() : null);
        
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
