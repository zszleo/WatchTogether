package com.watchtogether.service;

import com.watchtogether.model.SessionHistory;
import com.watchtogether.repository.SessionHistoryRepository;
import com.watchtogether.service.SessionHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionHistoryServiceTest {

    @Mock
    private SessionHistoryRepository historyRepository;

    @InjectMocks
    private SessionHistoryService historyService;

    @Captor
    private ArgumentCaptor<SessionHistory> historyCaptor;

    private SessionHistory history1;
    private SessionHistory history2;

    @BeforeEach
    void setUp() {
        history1 = new SessionHistory();
        history1.setId(1L);
        history1.setSessionId("session-123");
        history1.setRoomId(1L);
        history1.setRoomName("Test Room 1");
        history1.setVideoTitle("Video 1");
        history1.setJoinedAt(LocalDateTime.now().minusHours(2));

        history2 = new SessionHistory();
        history2.setId(2L);
        history2.setSessionId("session-123");
        history2.setRoomId(2L);
        history2.setRoomName("Test Room 2");
        history2.setVideoTitle("Video 2");
        history2.setJoinedAt(LocalDateTime.now().minusHours(1));
    }

    @Test
    void joinRoom_WithValidData_ShouldCreateHistory() {
        String sessionId = "session-123";
        Long roomId = 1L;
        String roomCode = "ROO123";
        String roomName = "Test Room";
        String videoTitle = "Test Video";

        when(historyRepository.save(any(SessionHistory.class))).thenAnswer(invocation -> {
            SessionHistory h = invocation.getArgument(0);
            h.setId(1L);
            return h;
        });

        SessionHistory result = historyService.joinRoom(sessionId, roomId, roomCode, roomName, videoTitle);

        assertNotNull(result);
        assertEquals(sessionId, result.getSessionId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(roomCode, result.getRoomCode());
        assertEquals(roomName, result.getRoomName());
        assertEquals(videoTitle, result.getVideoTitle());

        verify(historyRepository).save(historyCaptor.capture());
        SessionHistory saved = historyCaptor.getValue();
        assertEquals(sessionId, saved.getSessionId());
        assertEquals(roomId, saved.getRoomId());
    }

    @Test
    void joinRoom_WithNullVideoTitle_ShouldSaveSuccessfully() {
        String sessionId = "session-123";
        Long roomId = 1L;
        String roomCode = "ROO123";
        String roomName = "Test Room";

        when(historyRepository.save(any(SessionHistory.class))).thenAnswer(inv -> {
            SessionHistory h = inv.getArgument(0);
            h.setId(1L);
            return h;
        });

        SessionHistory result = historyService.joinRoom(sessionId, roomId, roomCode, roomName, null);

        assertNotNull(result);
        assertNull(result.getVideoTitle());
        verify(historyRepository).save(any(SessionHistory.class));
    }

    @Test
    void leaveRoom_WithExistingHistory_ShouldUpdateLeftAt() {
        Long historyId = 1L;
        when(historyRepository.findById(historyId)).thenReturn(Optional.of(history1));

        historyService.leaveRoom(historyId);

        verify(historyRepository).save(historyCaptor.capture());
        SessionHistory updated = historyCaptor.getValue();
        assertNotNull(updated.getLeftAt());
    }

    @Test
    void leaveRoom_WithNonExistentHistory_ShouldDoNothing() {
        Long historyId = 999L;
        when(historyRepository.findById(historyId)).thenReturn(Optional.empty());

        historyService.leaveRoom(historyId);

        verify(historyRepository, never()).save(any());
    }

    @Test
    void getUserHistory_ShouldReturnAllHistoryForUser() {
        String sessionId = "session-123";
        List<SessionHistory> histories = Arrays.asList(history2, history1);
        when(historyRepository.findBySessionIdOrderByJoinedAtDesc(sessionId)).thenReturn(histories);

        List<SessionHistory> result = historyService.getUserHistory(sessionId);

        assertEquals(2, result.size());
        assertEquals(history2.getId(), result.get(0).getId());
        verify(historyRepository).findBySessionIdOrderByJoinedAtDesc(sessionId);
    }

    @Test
    void getUserHistory_WithNoHistory_ShouldReturnEmptyList() {
        String sessionId = "session-999";
        when(historyRepository.findBySessionIdOrderByJoinedAtDesc(sessionId)).thenReturn(List.of());

        List<SessionHistory> result = historyService.getUserHistory(sessionId);

        assertTrue(result.isEmpty());
    }

    @Test
    void getUserHistoryWithLimit_ShouldReturnLimitedResults() {
        String sessionId = "session-123";
        List<SessionHistory> histories = Arrays.asList(history2, history1);
        when(historyRepository.findBySessionIdOrderByJoinedAtDescLimit(eq(sessionId), any(PageRequest.class))).thenReturn(histories);

        List<SessionHistory> result = historyService.getUserHistoryWithLimit(sessionId, 10);

        assertEquals(2, result.size());
        verify(historyRepository).findBySessionIdOrderByJoinedAtDescLimit(eq(sessionId), any(PageRequest.class));
    }

    @Test
    void getUserHistoryWithLimit_WithZeroLimit_ShouldReturnEmptyList() {
        String sessionId = "session-123";

        List<SessionHistory> result = historyService.getUserHistoryWithLimit(sessionId, 0);

        assertTrue(result.isEmpty());
    }
}
