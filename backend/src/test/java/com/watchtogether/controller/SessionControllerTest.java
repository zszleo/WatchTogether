package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.SessionResp;
import com.watchtogether.dto.resp.SessionHistoryResp;
import com.watchtogether.dto.req.CreateSessionReq;
import com.watchtogether.dto.req.UpdateProfileReq;
import com.watchtogether.model.Room;
import com.watchtogether.model.Session;
import com.watchtogether.model.SessionHistory;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionHistoryService;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionControllerTest {

    @Mock
    private SessionService sessionService;

    @Mock
    private SessionHistoryService historyService;

    @Mock
    private RoomService roomService;

    @InjectMocks
    private SessionController sessionController;

    private Session mockSession;
    private Room mockRoom;
    private SessionHistory mockHistory;

    @BeforeEach
    void setUp() {
        mockSession = new Session();
        mockSession.setId("session-123");
        mockSession.setNickname("TestUser");
        mockSession.setAvatar("avatar1");
        mockSession.setIsOnline(true);
        mockSession.setCreatedAt(LocalDateTime.now());
        mockSession.setLastSeenAt(LocalDateTime.now());

        mockRoom = new Room();
        mockRoom.setId(1L);
        mockRoom.setCode("ABC123");
        mockRoom.setName("Test Room");
        mockRoom.setVideoTitle("Test Video");

        mockHistory = new SessionHistory();
        mockHistory.setId(1L);
        mockHistory.setSessionId("session-123");
        mockHistory.setRoomId(1L);
        mockHistory.setRoomCode("ABC123");
        mockHistory.setRoomName("Test Room");
        mockHistory.setVideoTitle("Test Video");
        mockHistory.setJoinedAt(LocalDateTime.now());
    }

    @Test
    void updateProfile_WithValidSession_ShouldUpdateSuccessfully() {
        String sessionId = "session-123";
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");
        request.setAvatar("new-avatar");

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(sessionService.updateSession(eq(sessionId), eq("NewNickname"), eq("new-avatar")))
            .thenReturn(Optional.of(mockSession));

        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.updateProfile(sessionId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void updateProfile_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.updateProfile(sessionId, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void updateProfile_WithPartialUpdate_ShouldUpdateOnlyProvidedFields() {
        String sessionId = "session-123";
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(sessionService.updateSession(eq(sessionId), eq("NewNickname"), isNull()))
            .thenReturn(Optional.of(mockSession));

        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.updateProfile(sessionId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void getHistory_WithValidSession_ShouldReturnHistory() {
        String sessionId = "session-123";
        List<SessionHistory> histories = Arrays.asList(mockHistory);

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(historyService.getUserHistoryWithLimit(sessionId, 50)).thenReturn(histories);

        ResponseEntity<ApiResp<List<SessionHistoryResp>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
    }

    @Test
    void getHistory_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<List<SessionHistoryResp>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getHistory_WithEmptyHistory_ShouldReturnEmptyList() {
        String sessionId = "session-123";

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(historyService.getUserHistoryWithLimit(sessionId, 50)).thenReturn(List.of());

        ResponseEntity<ApiResp<List<SessionHistoryResp>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getData().isEmpty());
    }

    @Test
    void joinRoom_WithValidData_ShouldCreateHistory() {
        String sessionId = "session-123";
        String roomCode = "ABC123";

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(mockRoom));
        when(historyService.joinRoom(eq(sessionId), eq(1L), eq("ABC123"), any(), any()))
            .thenReturn(mockHistory);

        ResponseEntity<ApiResp<SessionHistoryResp>> response = 
            sessionController.joinRoom(sessionId, roomCode);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void joinRoom_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";
        String roomCode = "ABC123";

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<SessionHistoryResp>> response = 
            sessionController.joinRoom(sessionId, roomCode);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void joinRoom_WithNonExistentRoom_ShouldReturnNotFound() {
        String sessionId = "session-123";
        String roomCode = "NOTFND";

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.empty());

        ResponseEntity<ApiResp<SessionHistoryResp>> response = 
            sessionController.joinRoom(sessionId, roomCode);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void leaveRoom_WithValidSession_ShouldUpdateHistory() {
        String sessionId = "session-123";
        Long historyId = 1L;

        when(sessionService.validateSession(sessionId)).thenReturn(true);

        ResponseEntity<ApiResp<Void>> response = 
            sessionController.leaveRoom(sessionId, historyId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(historyService).leaveRoom(historyId);
    }

    @Test
    void leaveRoom_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";
        Long historyId = 1L;

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<Void>> response = 
            sessionController.leaveRoom(sessionId, historyId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void createSession_WithValidRequest_ShouldCreateAndReturnSession() {
        // Arrange
        CreateSessionReq request = new CreateSessionReq();
        request.setNickname("TestUser");
        request.setAvatar("avatar.jpg");
        
        Session newSession = new Session();
        newSession.setId("new-session-123");
        newSession.setNickname("TestUser");
        newSession.setAvatar("avatar.jpg");
        newSession.setIsOnline(false);
        newSession.setCreatedAt(LocalDateTime.now());
        newSession.setLastSeenAt(LocalDateTime.now());

        when(sessionService.createSession("TestUser", "avatar.jpg")).thenReturn(newSession);

        // Act
        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.createSession(request);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("new-session-123", response.getBody().getData().getId());
        assertEquals("TestUser", response.getBody().getData().getNickname());
        assertEquals("avatar.jpg", response.getBody().getData().getAvatar());
        
        verify(sessionService).createSession("TestUser", "avatar.jpg");
    }

    @Test
    void createSession_WithNullAvatar_ShouldCreateSessionWithNullAvatar() {
        // Arrange
        CreateSessionReq request = new CreateSessionReq();
        request.setNickname("TestUser");
        request.setAvatar(null);
        
        Session newSession = new Session();
        newSession.setId("new-session-123");
        newSession.setNickname("TestUser");
        newSession.setAvatar(null);
        newSession.setIsOnline(false);
        newSession.setCreatedAt(LocalDateTime.now());
        newSession.setLastSeenAt(LocalDateTime.now());

        when(sessionService.createSession("TestUser", null)).thenReturn(newSession);

        // Act
        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.createSession(request);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertNull(response.getBody().getData().getAvatar());
        
        verify(sessionService).createSession("TestUser", null);
    }

    @Test
    void getSession_WithExistingSession_ShouldReturnSession() {
        // Arrange
        String sessionId = "session-123";
        when(sessionService.getSession(sessionId)).thenReturn(Optional.of(mockSession));

        // Act
        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.getSession(sessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(sessionId, response.getBody().getData().getId());
        assertEquals("TestUser", response.getBody().getData().getNickname());
        
        verify(sessionService).getSession(sessionId);
    }

    @Test
    void getSession_WithNonExistentSession_ShouldReturnNotFound() {
        // Arrange
        String sessionId = "non-existent-session";
        when(sessionService.getSession(sessionId)).thenReturn(Optional.empty());

        // Act
        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.getSession(sessionId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Session not found"));
        
        verify(sessionService).getSession(sessionId);
    }

    @Test
    void deleteSession_WithExistingSession_ShouldDeleteSuccessfully() {
        // Arrange
        String sessionId = "session-123";
        when(sessionService.validateSession(sessionId)).thenReturn(true);

        // Act
        ResponseEntity<ApiResp<Void>> response = 
            sessionController.deleteSession(sessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Session deleted successfully"));
        
        verify(sessionService).validateSession(sessionId);
        verify(sessionService).deleteSession(sessionId);
    }

    @Test
    void deleteSession_WithNonExistentSession_ShouldReturnNotFound() {
        // Arrange
        String sessionId = "non-existent-session";
        when(sessionService.validateSession(sessionId)).thenReturn(false);

        // Act
        ResponseEntity<ApiResp<Void>> response = 
            sessionController.deleteSession(sessionId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Session not found"));
        
        verify(sessionService).validateSession(sessionId);
        verify(sessionService, never()).deleteSession(anyString());
    }

    @Test
    void validateSession_WithValidSession_ShouldReturnTrue() {
        // Arrange
        String sessionId = "session-123";
        when(sessionService.validateSession(sessionId)).thenReturn(true);

        // Act
        ResponseEntity<ApiResp<Boolean>> response = 
            sessionController.validateSession(sessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertTrue(response.getBody().getData());
        
        verify(sessionService).validateSession(sessionId);
    }

    @Test
    void validateSession_WithInvalidSession_ShouldReturnFalse() {
        // Arrange
        String sessionId = "invalid-session";
        when(sessionService.validateSession(sessionId)).thenReturn(false);

        // Act
        ResponseEntity<ApiResp<Boolean>> response = 
            sessionController.validateSession(sessionId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertFalse(response.getBody().getData());
        
        verify(sessionService).validateSession(sessionId);
    }

    @Test
    void updateProfile_WithUpdateSessionReturningEmpty_ShouldReturnNotFound() {
        // Arrange
        String sessionId = "session-123";
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");
        request.setAvatar("new-avatar");

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(sessionService.updateSession(eq(sessionId), eq("NewNickname"), eq("new-avatar")))
            .thenReturn(Optional.empty());

        // Act
        ResponseEntity<ApiResp<SessionResp>> response = 
            sessionController.updateProfile(sessionId, request);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Session not found"));
        
        verify(sessionService).validateSession(sessionId);
        verify(sessionService).updateSession(sessionId, "NewNickname", "new-avatar");
    }

    @Test
    void getHistory_WithCustomLimit_ShouldUseProvidedLimit() {
        // Arrange
        String sessionId = "session-123";
        List<SessionHistory> histories = Arrays.asList(mockHistory);

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(historyService.getUserHistoryWithLimit(sessionId, 10)).thenReturn(histories);

        // Act
        ResponseEntity<ApiResp<List<SessionHistoryResp>>> response = 
            sessionController.getHistory(sessionId, 10);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        
        verify(historyService).getUserHistoryWithLimit(sessionId, 10);
    }
}
