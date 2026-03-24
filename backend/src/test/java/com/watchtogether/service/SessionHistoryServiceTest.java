package com.watchtogether.service;

import com.watchtogether.model.SessionHistory;
import com.watchtogether.repository.SessionHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionHistoryServiceTest {

    @Mock
    private SessionHistoryRepository historyRepository;

    @InjectMocks
    private SessionHistoryService sessionHistoryService;

    private String testSessionId;
    private Long testRoomId;
    private String testRoomCode;
    private String testRoomName;
    private String testVideoTitle;
    private SessionHistory testHistory;

    @BeforeEach
    void setUp() {
        testSessionId = "session123";
        testRoomId = 1L;
        testRoomCode = "ROOM123";
        testRoomName = "Test Room";
        testVideoTitle = "Test Video";

        testHistory = new SessionHistory();
        testHistory.setId(100L);
        testHistory.setSessionId(testSessionId);
        testHistory.setRoomId(testRoomId);
        testHistory.setRoomCode(testRoomCode);
        testHistory.setRoomName(testRoomName);
        testHistory.setVideoTitle(testVideoTitle);
        testHistory.setJoinedAt(LocalDateTime.now());
    }

    @Test
    void joinRoom_shouldCreateSessionHistory() {
        // Given
        when(historyRepository.save(any(SessionHistory.class))).thenAnswer(invocation -> {
            SessionHistory history = invocation.getArgument(0);
            history.setId(100L);
            history.setJoinedAt(LocalDateTime.now());
            return history;
        });

        // When
        SessionHistory result = sessionHistoryService.joinRoom(
                testSessionId, testRoomId, testRoomCode, testRoomName, testVideoTitle);

        // Then
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(testSessionId, result.getSessionId());
        assertEquals(testRoomId, result.getRoomId());
        assertEquals(testRoomCode, result.getRoomCode());
        assertEquals(testRoomName, result.getRoomName());
        assertEquals(testVideoTitle, result.getVideoTitle());
        assertNotNull(result.getJoinedAt());
        assertNull(result.getLeftAt());

        verify(historyRepository, times(1)).save(any(SessionHistory.class));
    }

    @Test
    void leaveRoom_shouldUpdateHistoryWhenFound() {
        // Given
        Long historyId = 100L;
        when(historyRepository.findById(historyId)).thenReturn(Optional.of(testHistory));
        when(historyRepository.save(any(SessionHistory.class))).thenReturn(testHistory);

        // When
        sessionHistoryService.leaveRoom(historyId);

        // Then
        assertNotNull(testHistory.getLeftAt());
        verify(historyRepository, times(1)).findById(historyId);
        verify(historyRepository, times(1)).save(testHistory);
    }

    @Test
    void leaveRoom_shouldDoNothingWhenHistoryNotFound() {
        // Given
        Long historyId = 999L;
        when(historyRepository.findById(historyId)).thenReturn(Optional.empty());

        // When
        sessionHistoryService.leaveRoom(historyId);

        // Then
        verify(historyRepository, times(1)).findById(historyId);
        verify(historyRepository, never()).save(any(SessionHistory.class));
    }

    @Test
    void getUserHistory_shouldReturnHistoriesOrderedByJoinedAtDesc() {
        // Given
        List<SessionHistory> histories = Arrays.asList(testHistory);
        when(historyRepository.findBySessionIdOrderByJoinedAtDesc(testSessionId)).thenReturn(histories);

        // When
        List<SessionHistory> result = sessionHistoryService.getUserHistory(testSessionId);

        // Then
        assertEquals(1, result.size());
        assertEquals(testHistory.getId(), result.get(0).getId());
        verify(historyRepository, times(1)).findBySessionIdOrderByJoinedAtDesc(testSessionId);
    }

    @Test
    void getUserHistoryWithLimit_shouldReturnLimitedHistories() {
        // Given
        int limit = 5;
        List<SessionHistory> histories = Arrays.asList(testHistory);
        when(historyRepository.findBySessionIdOrderByJoinedAtDescLimit(eq(testSessionId), any(PageRequest.class)))
                .thenReturn(histories);

        // When
        List<SessionHistory> result = sessionHistoryService.getUserHistoryWithLimit(testSessionId, limit);

        // Then
        assertEquals(1, result.size());
        verify(historyRepository, times(1)).findBySessionIdOrderByJoinedAtDescLimit(eq(testSessionId), any(PageRequest.class));
    }

    @Test
    void getUserHistoryWithLimit_shouldReturnEmptyListWhenLimitIsZero() {
        // Given
        int limit = 0;

        // When
        List<SessionHistory> result = sessionHistoryService.getUserHistoryWithLimit(testSessionId, limit);

        // Then
        assertTrue(result.isEmpty());
        verify(historyRepository, never()).findBySessionIdOrderByJoinedAtDescLimit(anyString(), any(PageRequest.class));
    }

    @Test
    void getUserHistoryWithLimit_shouldReturnEmptyListWhenLimitIsNegative() {
        // Given
        int limit = -5;

        // When
        List<SessionHistory> result = sessionHistoryService.getUserHistoryWithLimit(testSessionId, limit);

        // Then
        assertTrue(result.isEmpty());
        verify(historyRepository, never()).findBySessionIdOrderByJoinedAtDescLimit(anyString(), any(PageRequest.class));
    }
}