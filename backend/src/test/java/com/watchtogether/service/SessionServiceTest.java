package com.watchtogether.service;

import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.utils.RedisUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static com.watchtogether.common.AppConstants.KEY_PREFIX_SESSION;
import static com.watchtogether.common.AppConstants.TTL_SESSION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private RedisUtil redisUtil;

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionService sessionService;

    private String testSessionId;
    private String testNickname;
    private String testAvatar;
    private Session testSession;

    @BeforeEach
    void setUp() {
        testSessionId = "testSessionId123456789012345678901234";
        testNickname = "TestUser";
        testAvatar = "https://example.com/avatar.jpg";
        
        testSession = new Session();
        testSession.setId(testSessionId);
        testSession.setNickname(testNickname);
        testSession.setAvatar(testAvatar);
        testSession.setCreatedAt(LocalDateTime.now());
        testSession.setUpdatedAt(LocalDateTime.now());
        testSession.setLastSeenAt(LocalDateTime.now());
    }

    @Test
    void createSession_shouldCreateSessionAndCacheInRedis() {
        // Given
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session session = invocation.getArgument(0);
            // Ensure session has an ID
            if (session.getId() == null) {
                session.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 32));
            }
            return session;
        });

        // When
        Session createdSession = sessionService.createSession(testNickname, testAvatar);

        // Then
        assertNotNull(createdSession);
        assertNotNull(createdSession.getId());
        assertEquals(32, createdSession.getId().length());
        assertEquals(testNickname, createdSession.getNickname());
        assertEquals(testAvatar, createdSession.getAvatar());
        assertNotNull(createdSession.getCreatedAt());
        assertNotNull(createdSession.getUpdatedAt());
        assertNotNull(createdSession.getLastSeenAt());

        // Verify repository save was called
        verify(sessionRepository, times(1)).save(any(Session.class));

        // Verify Redis cache was set
        verify(redisUtil, times(1)).set(
            eq(KEY_PREFIX_SESSION + createdSession.getId()),
            any(Map.class),
            eq(TTL_SESSION)
        );
    }

    @Test
    void getSession_shouldReturnSessionFromRedisWhenCached() {
        // Given
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("id", testSessionId);
        cachedData.put("nickname", testNickname);
        cachedData.put("avatar", testAvatar);
        cachedData.put("createdAt", testSession.getCreatedAt().toString());

        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(cachedData);

        // When
        Optional<Session> result = sessionService.getSession(testSessionId);

        // Then
        assertTrue(result.isPresent());
        Session session = result.get();
        assertEquals(testSessionId, session.getId());
        assertEquals(testNickname, session.getNickname());
        assertEquals(testAvatar, session.getAvatar());

        // Verify repository was not called (cache hit)
        verify(sessionRepository, never()).findById(anyString());
        verify(redisUtil, never()).set(anyString(), any(), anyLong());
    }

    @Test
    void getSession_shouldFallbackToDatabaseAndCacheWhenNotInRedis() {
        // Given
        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(null);
        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));

        // When
        Optional<Session> result = sessionService.getSession(testSessionId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testSessionId, result.get().getId());

        // Verify repository was called
        verify(sessionRepository, times(1)).findById(testSessionId);

        // Verify Redis cache was updated
        verify(redisUtil, times(1)).set(
            eq(KEY_PREFIX_SESSION + testSessionId),
            any(Map.class),
            eq(TTL_SESSION)
        );
    }

    @Test
    void getSession_shouldReturnEmptyWhenSessionNotFound() {
        // Given
        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(null);
        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

        // When
        Optional<Session> result = sessionService.getSession(testSessionId);

        // Then
        assertFalse(result.isPresent());

        // Verify Redis was not updated
        verify(redisUtil, never()).set(anyString(), any(), anyLong());
    }

    @Test
    void validateSession_shouldReturnTrueWhenSessionInRedis() {
        // Given
        when(redisUtil.hasKey(KEY_PREFIX_SESSION + testSessionId)).thenReturn(true);

        // When
        boolean isValid = sessionService.validateSession(testSessionId);

        // Then
        assertTrue(isValid);
        verify(sessionRepository, never()).existsById(anyString());
    }

    @Test
    void validateSession_shouldReturnTrueWhenSessionInDatabase() {
        // Given
        when(redisUtil.hasKey(KEY_PREFIX_SESSION + testSessionId)).thenReturn(false);
        when(sessionRepository.existsById(testSessionId)).thenReturn(true);

        // When
        boolean isValid = sessionService.validateSession(testSessionId);

        // Then
        assertTrue(isValid);
    }

    @Test
    void validateSession_shouldReturnFalseWhenSessionNotFound() {
        // Given
        when(redisUtil.hasKey(KEY_PREFIX_SESSION + testSessionId)).thenReturn(false);
        when(sessionRepository.existsById(testSessionId)).thenReturn(false);

        // When
        boolean isValid = sessionService.validateSession(testSessionId);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateSession_shouldReturnFalseWhenSessionIdIsNull() {
        // When
        boolean isValid = sessionService.validateSession(null);

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateSession_shouldReturnFalseWhenSessionIdIsEmpty() {
        // When
        boolean isValid = sessionService.validateSession("");

        // Then
        assertFalse(isValid);
    }

    @Test
    void validateSession_shouldReturnFalseWhenSessionIdIsBlank() {
        // When
        boolean isValid = sessionService.validateSession("   ");

        // Then
        assertFalse(isValid);
    }

    @Test
    void updateSessionSocket_shouldUpdateDatabaseAndRedis() {
        // Given
        String socketId = "socket123";
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("id", testSessionId);
        cachedData.put("nickname", testNickname);

        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(cachedData);

        // When
        sessionService.updateSessionSocket(testSessionId, socketId);

        // Then
        verify(sessionRepository, times(1)).updateSocketInfo(eq(testSessionId), eq(socketId), any(LocalDateTime.class));
        verify(redisUtil, times(1)).set(
            eq(KEY_PREFIX_SESSION + testSessionId),
            eq(cachedData),
            eq(TTL_SESSION)
        );
        assertTrue(cachedData.containsKey("socketId"));
        assertEquals(socketId, cachedData.get("socketId"));
    }

    @Test
    void updateSessionSocket_shouldNotUpdateRedisWhenCacheMissing() {
        // Given
        String socketId = "socket123";
        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(null);

        // When
        sessionService.updateSessionSocket(testSessionId, socketId);

        // Then
        verify(sessionRepository, times(1)).updateSocketInfo(eq(testSessionId), eq(socketId), any(LocalDateTime.class));
        verify(redisUtil, never()).set(anyString(), any(), anyLong());
    }

    @Test
    void updateSessionLastSeen_shouldUpdateDatabaseAndExtendRedisTTL() {
        // Given
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("id", testSessionId);

        when(redisUtil.get(KEY_PREFIX_SESSION + testSessionId, Map.class)).thenReturn(cachedData);

        // When
        sessionService.updateSessionLastSeen(testSessionId);

        // Then
        verify(sessionRepository, times(1)).updateLastSeen(eq(testSessionId), any(LocalDateTime.class));
        verify(redisUtil, times(1)).set(
            eq(KEY_PREFIX_SESSION + testSessionId),
            eq(cachedData),
            eq(TTL_SESSION)
        );
    }

    @Test
    void deleteSession_shouldDeleteFromDatabaseAndRedis() {
        // When
        sessionService.deleteSession(testSessionId);

        // Then
        verify(sessionRepository, times(1)).deleteById(testSessionId);
        verify(redisUtil, times(1)).delete(KEY_PREFIX_SESSION + testSessionId);
    }

    @Test
    void updateSession_shouldUpdateNicknameAndAvatar() {
        // Given
        String newNickname = "NewNickname";
        String newAvatar = "https://example.com/new-avatar.jpg";

        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, newNickname, newAvatar);

        // Then
        assertTrue(result.isPresent());
        Session updatedSession = result.get();
        assertEquals(newNickname, updatedSession.getNickname());
        assertEquals(newAvatar, updatedSession.getAvatar());

        verify(sessionRepository, times(1)).findById(testSessionId);
        verify(sessionRepository, times(1)).save(testSession);
        verify(redisUtil, times(1)).set(
            eq(KEY_PREFIX_SESSION + testSessionId),
            any(Map.class),
            eq(TTL_SESSION)
        );
    }

    @Test
    void updateSession_shouldHandleNullNickname() {
        // Given
        String newAvatar = "https://example.com/new-avatar.jpg";
        String originalNickname = testSession.getNickname();

        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, null, newAvatar);

        // Then
        assertTrue(result.isPresent());
        Session updatedSession = result.get();
        assertEquals(originalNickname, updatedSession.getNickname()); // Should remain unchanged
        assertEquals(newAvatar, updatedSession.getAvatar());
    }

    @Test
    void updateSession_shouldHandleEmptyNickname() {
        // Given
        String newAvatar = "https://example.com/new-avatar.jpg";
        String originalNickname = testSession.getNickname();

        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, "", newAvatar);

        // Then
        assertTrue(result.isPresent());
        Session updatedSession = result.get();
        assertEquals(originalNickname, updatedSession.getNickname()); // Should remain unchanged
        assertEquals(newAvatar, updatedSession.getAvatar());
    }

    @Test
    void updateSession_shouldHandleBlankNickname() {
        // Given
        String newAvatar = "https://example.com/new-avatar.jpg";
        String originalNickname = testSession.getNickname();

        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, "   ", newAvatar);

        // Then
        assertTrue(result.isPresent());
        Session updatedSession = result.get();
        assertEquals(originalNickname, updatedSession.getNickname()); // Should remain unchanged
        assertEquals(newAvatar, updatedSession.getAvatar());
    }

    @Test
    void updateSession_shouldHandleNullAvatar() {
        // Given
        String newNickname = "NewNickname";
        String originalAvatar = testSession.getAvatar();

        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(testSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, newNickname, null);

        // Then
        assertTrue(result.isPresent());
        Session updatedSession = result.get();
        assertEquals(newNickname, updatedSession.getNickname());
        assertEquals(originalAvatar, updatedSession.getAvatar()); // Should remain unchanged
    }

    @Test
    void updateSession_shouldReturnEmptyWhenSessionNotFound() {
        // Given
        when(sessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

        // When
        Optional<Session> result = sessionService.updateSession(testSessionId, "NewNickname", "newAvatar");

        // Then
        assertFalse(result.isPresent());
        verify(sessionRepository, never()).save(any(Session.class));
        verify(redisUtil, never()).set(anyString(), any(), anyLong());
    }
}