package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.SessionResp;
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
        mockRoom.setName("Test Room");
        mockRoom.setVideoTitle("Test Video");

        mockHistory = new SessionHistory();
        mockHistory.setId(1L);
        mockHistory.setSessionId("session-123");
        mockHistory.setRoomId(1L);
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

        ResponseEntity<ApiResp<List<SessionHistory>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
    }

    @Test
    void getHistory_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<List<SessionHistory>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getHistory_WithEmptyHistory_ShouldReturnEmptyList() {
        String sessionId = "session-123";

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(historyService.getUserHistoryWithLimit(sessionId, 50)).thenReturn(List.of());

        ResponseEntity<ApiResp<List<SessionHistory>>> response = 
            sessionController.getHistory(sessionId, 50);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().getData().isEmpty());
    }

    @Test
    void joinRoom_WithValidData_ShouldCreateHistory() {
        String sessionId = "session-123";
        Long roomId = 1L;

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomById(roomId)).thenReturn(Optional.of(mockRoom));
        when(historyService.joinRoom(eq(sessionId), eq(roomId), any(), any()))
            .thenReturn(mockHistory);

        ResponseEntity<ApiResp<SessionHistory>> response = 
            sessionController.joinRoom(sessionId, roomId);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void joinRoom_WithInvalidSession_ShouldReturnNotFound() {
        String sessionId = "invalid-session";
        Long roomId = 1L;

        when(sessionService.validateSession(sessionId)).thenReturn(false);

        ResponseEntity<ApiResp<SessionHistory>> response = 
            sessionController.joinRoom(sessionId, roomId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void joinRoom_WithNonExistentRoom_ShouldReturnNotFound() {
        String sessionId = "session-123";
        Long roomId = 999L;

        when(sessionService.validateSession(sessionId)).thenReturn(true);
        when(roomService.getRoomById(roomId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResp<SessionHistory>> response = 
            sessionController.joinRoom(sessionId, roomId);

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
}
