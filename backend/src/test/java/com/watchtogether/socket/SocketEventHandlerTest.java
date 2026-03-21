package com.watchtogether.socket;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.BroadcastOperations;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import com.watchtogether.handler.SocketEventHandler;
import com.watchtogether.model.Room;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.service.ChatMessageService;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import com.watchtogether.utils.RedisUtil;
import com.watchtogether.dto.event.JoinRoomEvent;
import com.watchtogether.dto.event.LeaveRoomEvent;
import com.watchtogether.dto.event.VideoPlayEvent;
import com.watchtogether.dto.event.VideoPauseEvent;
import com.watchtogether.dto.event.VideoSeekEvent;
import com.watchtogether.dto.event.VideoUrlChangeEvent;
import com.watchtogether.dto.event.ChatMessageEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.*;

import static com.watchtogether.utils.RedisUtil.KEY_PREFIX_SESSION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SocketEventHandlerTest {

    @Mock
    private SocketIOServer socketServer;
    @Mock
    private RedisUtil redisUtil;
    @Mock
    private RoomService roomService;
    @Mock
    private SessionService sessionService;
    @Mock
    private ChatMessageService chatMessageService;
    @Mock
    private SocketIOClient client;
    @Mock
    private AckRequest ackRequest;
    @Mock
    private BroadcastOperations broadcastOperations;
    @Mock
    private SocketIONamespace socketIONamespace;

    private SocketEventHandler socketEventHandler;
    private String socketId = "12345678-1234-1234-1234-123456789012";
    private String sessionId = "session-123";
    private String roomCode = "ABC123";
    private Long roomId = 1L;
    private Room mockRoom;

    @BeforeEach
    void setUp() {
        socketEventHandler = new SocketEventHandler();
        socketEventHandler.socketServer = socketServer;
        socketEventHandler.redisUtil = redisUtil;
        socketEventHandler.roomService = roomService;
        socketEventHandler.sessionService = sessionService;
        socketEventHandler.chatMessageService = chatMessageService;

        UUID socketUuid = UUID.fromString(socketId);
        when(client.getSessionId()).thenReturn(socketUuid);
        
        mockRoom = new Room();
        mockRoom.setId(roomId);
        mockRoom.setCode(roomCode);
        mockRoom.setName("Test Room");
        mockRoom.setIsPublic(true);
        mockRoom.setVideoUrl("https://example.com/video.mp4");
        mockRoom.setVideoTitle("Test Video");
        mockRoom.setCurrentPlaybackTime(0.0);
        mockRoom.setIsPlaying(false);
        
        when(socketServer.getRoomOperations(anyString())).thenReturn(broadcastOperations);
        when(client.getNamespace()).thenReturn(socketIONamespace);
        when(socketIONamespace.getRoomOperations(anyString())).thenReturn(broadcastOperations);
    }

    @Test
    void onConnect_ShouldStoreSocketMappingInRedis() {
        when(client.getSessionId()).thenReturn(UUID.fromString("12345678-1234-1234-1234-123456789012"));
        socketEventHandler.onConnect(client);
        verify(redisUtil).set(eq(RedisUtil.KEY_PREFIX_SOCKET + socketId), any(Map.class), eq(RedisUtil.TTL_SESSION));
    }

    @Test
    void onDisconnect_WithRoomMembership_ShouldCleanupAndBroadcast() {
        Map<String, String> socketMapping = new HashMap<>();
        socketMapping.put("sessionId", sessionId);
        socketMapping.put("roomCode", roomCode);
        socketMapping.put("roomId", roomId.toString());
        when(redisUtil.get(eq(KEY_PREFIX_SESSION + "socket:" + socketId), eq(Map.class))).thenReturn(socketMapping);
        when(redisUtil.getRoomUsers(roomId.toString())).thenReturn(new HashMap<>());

        socketEventHandler.onDisconnect(client);

        verify(socketServer.getRoomOperations(roomCode)).sendEvent(eq("user-left"), any(Map.class));
        verify(sessionService).leaveRoom(sessionId);
        verify(roomService).updateRoomActivity(roomId);
    }

    @Test
    void onDisconnect_WithoutRoomMembership_ShouldOnlyCleanupSocket() {
        when(redisUtil.get(eq(KEY_PREFIX_SESSION + "socket:" + socketId), eq(Map.class))).thenReturn(null);
        socketEventHandler.onDisconnect(client);
        verify(sessionService, never()).leaveRoom(anyString());
        verify(roomService, never()).updateRoomActivity(anyLong());
        verify(redisUtil).delete(RedisUtil.KEY_PREFIX_SOCKET + socketId);
    }

    @Test
    void onJoinRoom_WithValidData_ShouldJoinRoom() {
        JoinRoomEvent joinData = new JoinRoomEvent();
        joinData.setRoomCode(roomCode);
        joinData.setSessionId(sessionId);
        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(mockRoom));

        socketEventHandler.onJoinRoom(client, joinData, ackRequest);

        verify(client).joinRoom(roomCode);
        verify(sessionService).joinRoom(sessionId, roomId);
        verify(redisUtil).setRoomUsers(eq(roomId.toString()), any(Map.class));
        verify(roomService).updateRoomActivity(roomId);
    }

    @Test
    void onJoinRoom_WithoutRoomId_ShouldNotJoin() {
        JoinRoomEvent joinData = new JoinRoomEvent();
        joinData.setSessionId(sessionId);
        socketEventHandler.onJoinRoom(client, joinData, ackRequest);
        verify(client, never()).joinRoom(anyString());
        verify(sessionService, never()).validateSession(anyString());
    }

    @Test
    void onJoinRoom_WithInvalidSession_ShouldNotJoin() {
        JoinRoomEvent joinData = new JoinRoomEvent();
        joinData.setRoomCode(roomCode);
        joinData.setSessionId(sessionId);
        when(sessionService.validateSession(sessionId)).thenReturn(false);
        socketEventHandler.onJoinRoom(client, joinData, ackRequest);
        verify(client, never()).joinRoom(anyString());
    }

    @Test
    void onJoinRoom_WithNonExistentRoom_ShouldNotJoin() {
        JoinRoomEvent joinData = new JoinRoomEvent();
        joinData.setRoomCode(roomCode);
        joinData.setSessionId(sessionId);
        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.empty());
        socketEventHandler.onJoinRoom(client, joinData, ackRequest);
        verify(client, never()).joinRoom(anyString());
    }

    @Test
    void onLeaveRoom_WithValidRoomMembership_ShouldLeaveRoom() {
        LeaveRoomEvent leaveData = new LeaveRoomEvent();
        leaveData.setRoomCode(roomCode);
        Map<String, String> socketMapping = new HashMap<>();
        socketMapping.put("roomCode", roomCode);
        socketMapping.put("roomId", roomId.toString());
        socketMapping.put("sessionId", sessionId);
        when(redisUtil.get(eq(KEY_PREFIX_SESSION + "socket:" + socketId), eq(Map.class))).thenReturn(socketMapping);
        when(redisUtil.getRoomUsers(roomId.toString())).thenReturn(new HashMap<>());

        socketEventHandler.onLeaveRoom(client, leaveData, ackRequest);

        verify(client).leaveRoom(roomCode);
        verify(socketServer.getRoomOperations(roomCode)).sendEvent(eq("user-left"), any(Map.class));
    }

    @Test
    void onVideoPlay_WithValidRoom_ShouldBroadcastPlayEvent() {
        VideoPlayEvent playData = new VideoPlayEvent();
        playData.setRoomCode(roomCode);
        playData.setTime(30.5);

        socketEventHandler.onVideoPlay(client, playData, ackRequest);

        verify(redisUtil).setRoomPlayback(eq(roomCode), any(Map.class));
        verify(socketIONamespace.getRoomOperations(roomCode)).sendEvent(eq("video:sync-play"), any(Map.class), eq(client));
    }

    @Test
    void onVideoPause_WithValidRoom_ShouldBroadcastPauseEvent() {
        VideoPauseEvent pauseData = new VideoPauseEvent();
        pauseData.setRoomCode(roomCode);

        socketEventHandler.onVideoPause(client, pauseData, ackRequest);

        verify(redisUtil).setRoomPlayback(eq(roomCode), any(Map.class));
        verify(socketIONamespace.getRoomOperations(roomCode)).sendEvent(eq("video:sync-pause"), any(Map.class), eq(client));
    }

    @Test
    void onVideoSeek_WithValidRoom_ShouldBroadcastSeekEvent() {
        VideoSeekEvent seekData = new VideoSeekEvent();
        seekData.setRoomCode(roomCode);
        seekData.setTime(45.2);

        socketEventHandler.onVideoSeek(client, seekData, ackRequest);

        verify(redisUtil).setRoomPlayback(eq(roomCode), any(Map.class));
        verify(socketIONamespace.getRoomOperations(roomCode)).sendEvent(eq("video:sync-seek"), any(Map.class), eq(client));
    }

    @Test
    void onVideoUrlChange_WithValidData_ShouldBroadcast() {
        VideoUrlChangeEvent urlData = new VideoUrlChangeEvent();
        urlData.setRoomCode(roomCode);
        urlData.setUrl("https://new-video.com/video.mp4");

        socketEventHandler.onVideoUrlChange(client, urlData, ackRequest);

        verify(redisUtil).setRoom(eq(roomCode), any(Map.class));
        verify(socketIONamespace.getRoomOperations(roomCode)).sendEvent(eq("video:sync-url-change"), any(Map.class), eq(client));
    }

    @Test
    void onVideoUrlChange_WithEmptyRoomId_ShouldNotBroadcast() {
        VideoUrlChangeEvent urlData = new VideoUrlChangeEvent();
        urlData.setRoomCode("");
        urlData.setUrl("https://video.com/video.mp4");

        socketEventHandler.onVideoUrlChange(client, urlData, ackRequest);

        verify(redisUtil, never()).setRoom(anyString(), any(Map.class));
    }

    @Test
    void onVideoUrlChange_WithNullUrl_ShouldNotBroadcast() {
        VideoUrlChangeEvent urlData = new VideoUrlChangeEvent();
        urlData.setRoomCode(roomCode);
        urlData.setUrl(null);

        socketEventHandler.onVideoUrlChange(client, urlData, ackRequest);

        verify(redisUtil, never()).setRoom(anyString(), any(Map.class));
    }

    @Test
    void onChatMessage_WithValidRoom_ShouldSaveAndBroadcast() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode("1");
        messageData.setMessage("Hello World");
        messageData.setSender("testUser");
        
        com.watchtogether.model.ChatMessage savedMessage = new com.watchtogether.model.ChatMessage();
        savedMessage.setId(1L);
        savedMessage.setRoomId(1L);
        savedMessage.setContent("Hello World");
        savedMessage.setSessionId(socketId);
        savedMessage.setCreatedAt(java.time.LocalDateTime.now());
        when(chatMessageService.saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString())).thenReturn(savedMessage);

        socketEventHandler.onChatMessage(client, messageData, ackRequest);

        verify(chatMessageService).saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString());
        verify(socketServer.getRoomOperations("1")).sendEvent(eq("chat:message"), any(Map.class));
    }

    @Test
    void onChatMessage_WithNullRoomId_ShouldNotProcess() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode(null);
        messageData.setMessage("Hello");
        socketEventHandler.onChatMessage(client, messageData, ackRequest);
        verify(chatMessageService, never()).saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void onChatMessage_WithEmptyMessage_ShouldNotProcess() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode("1");
        messageData.setMessage("");
        socketEventHandler.onChatMessage(client, messageData, ackRequest);
        verify(chatMessageService, never()).saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void onChatMessage_WithTooLongMessage_ShouldNotProcess() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode("1");
        messageData.setMessage("a".repeat(1001));
        socketEventHandler.onChatMessage(client, messageData, ackRequest);
        verify(chatMessageService, never()).saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void onChatMessage_WithInvalidRoomIdFormat_ShouldNotProcess() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode("invalid-id");
        messageData.setMessage("Hello");
        socketEventHandler.onChatMessage(client, messageData, ackRequest);
        verify(chatMessageService, never()).saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void onChatMessage_WithDatabaseError_ShouldHandleGracefully() {
        ChatMessageEvent messageData = new ChatMessageEvent();
        messageData.setRoomCode("1");
        messageData.setMessage("Hello");
        when(chatMessageService.saveMessage(anyLong(), anyString(), anyString(), anyString(), anyString())).thenThrow(new RuntimeException("DB error"));
        assertDoesNotThrow(() -> socketEventHandler.onChatMessage(client, messageData, ackRequest));
    }

    @Test
    void onVideoPlay_WithEmptyRoomId_ShouldNotBroadcast() {
        VideoPlayEvent playData = new VideoPlayEvent();
        playData.setRoomCode("");
        playData.setTime(30.5);
        socketEventHandler.onVideoPlay(client, playData, ackRequest);
        verify(redisUtil, never()).setRoomPlayback(anyString(), any(Map.class));
    }

    @Test
    void onVideoPause_WithEmptyRoomId_ShouldNotBroadcast() {
        VideoPauseEvent pauseData = new VideoPauseEvent();
        pauseData.setRoomCode("");
        socketEventHandler.onVideoPause(client, pauseData, ackRequest);
        verify(redisUtil, never()).setRoomPlayback(anyString(), any(Map.class));
    }

    @Test
    void onVideoSeek_WithEmptyRoomId_ShouldNotBroadcast() {
        VideoSeekEvent seekData = new VideoSeekEvent();
        seekData.setRoomCode("");
        seekData.setTime(45.2);
        socketEventHandler.onVideoSeek(client, seekData, ackRequest);
        verify(redisUtil, never()).setRoomPlayback(anyString(), any(Map.class));
    }

    @Test
    void sendAckError_WithAckRequested_ShouldSendErrorData() {
        when(ackRequest.isAckRequested()).thenReturn(true);
        socketEventHandler.sendAckError(ackRequest, "Test error");
        verify(ackRequest, atLeastOnce()).sendAckData(any(Object[].class));
    }

    @Test
    void sendAckError_WithoutAckRequested_ShouldNotSend() {
        when(ackRequest.isAckRequested()).thenReturn(false);
        socketEventHandler.sendAckError(ackRequest, "Test error");
        verify(ackRequest, never()).sendAckData(any(Object[].class));
    }

    @Test
    void sendAckSuccess_WithAckRequested_ShouldSendSuccessData() {
        when(ackRequest.isAckRequested()).thenReturn(true);
        Map<String, Object> data = new HashMap<>();
        data.put("key", "value");
        socketEventHandler.sendAckSuccess(ackRequest, data);
        verify(ackRequest, atLeastOnce()).sendAckData(any(Object[].class));
    }

    @Test
    void sendAckSuccess_WithoutAckRequested_ShouldNotSend() {
        when(ackRequest.isAckRequested()).thenReturn(false);
        socketEventHandler.sendAckSuccess(ackRequest, new HashMap<>());
        verify(ackRequest, never()).sendAckData(any(Object[].class));
    }

    @Test
    void addUserToRoom_WithNewUser_ShouldAddToRedis() {
        when(redisUtil.getRoomUsers("1")).thenReturn(null);
        socketEventHandler.addUserToRoom("1", "session-1", "socket-1");
        verify(redisUtil).setRoomUsers(eq("1"), any(Map.class));
    }

    @Test
    void addUserToRoom_WithExistingUsers_ShouldPreserveAndAdd() {
        Map<String, Object> existingUsers = new HashMap<>();
        existingUsers.put("session-old", Map.of("sessionId", "session-old"));
        when(redisUtil.getRoomUsers("1")).thenReturn(existingUsers);
        socketEventHandler.addUserToRoom("1", "session-new", "socket-new");
        verify(redisUtil).setRoomUsers(eq("1"), any(Map.class));
    }

    @Test
    void removeUserFromRoom_WithExistingUser_ShouldRemove() {
        Map<String, Object> existingUsers = new HashMap<>();
        existingUsers.put("session-1", Map.of("sessionId", "session-1"));
        when(redisUtil.getRoomUsers("1")).thenReturn(existingUsers);
        socketEventHandler.removeUserFromRoom("1", "session-1");
        verify(redisUtil).setRoomUsers(eq("1"), any(Map.class));
    }

    @Test
    void removeUserFromRoom_WithNoUsers_ShouldNotThrow() {
        when(redisUtil.getRoomUsers("1")).thenReturn(null);
        assertDoesNotThrow(() -> socketEventHandler.removeUserFromRoom("1", "session-1"));
    }

    @Test
    void sendRoomState_WithOnlineUsers_ShouldIncludeUserCount() {
        Map<String, Object> usersData = new HashMap<>();
        usersData.put("s1", Map.of("sessionId", "s1"));
        usersData.put("s2", Map.of("sessionId", "s2"));
        when(redisUtil.getRoomUsers("1")).thenReturn(usersData);
        socketEventHandler.sendRoomState(client, mockRoom, roomCode);
        verify(client).sendEvent(eq("room-state"), any(Map.class));
    }

    @Test
    void sendRoomState_WithNoUsers_ShouldIncludeZeroCount() {
        when(redisUtil.getRoomUsers("1")).thenReturn(null);
        socketEventHandler.sendRoomState(client, mockRoom, roomCode);
        verify(client).sendEvent(eq("room-state"), any(Map.class));
    }
}
