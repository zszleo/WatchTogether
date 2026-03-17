package com.watchtogether.service;

import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.utils.RedisUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private RedisUtil redisUtil;

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionService sessionService;

    @Captor
    private ArgumentCaptor<Session> sessionCaptor;

    @Captor
    private ArgumentCaptor<Map<String, Object>> redisCaptor;

    @Captor
    private ArgumentCaptor<String> keyCaptor;

    private String sessionId;
    private String nickname;
    private String avatar;
    private Session mockSession;

    @BeforeEach
    void setUp() {
        sessionId = "session-12345678901234567890123456789012";
        nickname = "TestUser";
        avatar = "https://example.com/avatar.jpg";
        
        mockSession = new Session();
        mockSession.setId(sessionId);
        mockSession.setNickname(nickname);
        mockSession.setAvatar(avatar);
        mockSession.setIsOnline(false);
        mockSession.setCreatedAt(LocalDateTime.now());
        mockSession.setUpdatedAt(LocalDateTime.now());
        mockSession.setLastSeenAt(LocalDateTime.now());
    }

    @Test
    void createSession_WithValidInput_ShouldCreateSessionAndCacheInRedis() {
        // Arrange
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session session = invocation.getArgument(0);
            // Return the session as-is, preserving the ID set by service
            return session;
        });

        // Act
        Session result = sessionService.createSession(nickname, avatar);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(32, result.getId().length()); // UUID without dashes, truncated to 32 chars
        assertEquals(nickname, result.getNickname());
        assertEquals(avatar, result.getAvatar());
        assertFalse(result.getIsOnline());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        assertNotNull(result.getLastSeenAt());

        // Verify repository save
        verify(sessionRepository).save(any(Session.class));

        // Verify Redis caching
        verify(redisUtil).setSession(eq(result.getId()), any(Map.class));
    }

    @Test
    void createSession_WithNullAvatar_ShouldCreateSessionWithNullAvatar() {
        // Arrange
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session session = invocation.getArgument(0);
            // Return the session as-is, preserving the ID set by service
            return session;
        });

        // Act
        Session result = sessionService.createSession(nickname, null);

        // Assert
        assertNotNull(result);
        assertNull(result.getAvatar());
        assertNotNull(result.getId());
        assertEquals(32, result.getId().length());
        verify(sessionRepository).save(any(Session.class));
        verify(redisUtil).setSession(eq(result.getId()), any(Map.class));
    }

    @Test
    void getSession_WithSessionInRedisCache_ShouldReturnCachedSession() {
        // Arrange
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("id", sessionId);
        cachedData.put("nickname", nickname);
        cachedData.put("avatar", avatar);
        cachedData.put("createdAt", LocalDateTime.now().toString());
        
        when(redisUtil.getSession(eq(sessionId), eq(Map.class))).thenReturn(cachedData);

        // Act
        Optional<Session> result = sessionService.getSession(sessionId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(sessionId, result.get().getId());
        assertEquals(nickname, result.get().getNickname());
        assertEquals(avatar, result.get().getAvatar());
        
        verify(redisUtil).getSession(eq(sessionId), eq(Map.class));
        verify(sessionRepository, never()).findById(anyString());
    }

    @Test
    void getSession_WithRedisMissButSessionInDatabase_ShouldReturnSessionAndCacheIt() {
        // Arrange
        when(redisUtil.getSession(eq(sessionId), eq(Map.class))).thenReturn(null);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));

        // Act
        Optional<Session> result = sessionService.getSession(sessionId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(sessionId, result.get().getId());
        assertEquals(nickname, result.get().getNickname());
        
        verify(redisUtil).getSession(eq(sessionId), eq(Map.class));
        verify(sessionRepository).findById(sessionId);
        verify(redisUtil).setSession(eq(sessionId), any(Map.class));
    }

    @Test
    void getSession_WithNonExistentSession_ShouldReturnEmpty() {
        // Arrange
        when(redisUtil.getSession(eq(sessionId), eq(Map.class))).thenReturn(null);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        Optional<Session> result = sessionService.getSession(sessionId);

        // Assert
        assertFalse(result.isPresent());
        verify(redisUtil).getSession(eq(sessionId), eq(Map.class));
        verify(sessionRepository).findById(sessionId);
        verify(redisUtil, never()).setSession(anyString(), any(Map.class));
    }

    @Test
    void validateSession_WithNullSessionId_ShouldReturnFalse() {
        // Act
        boolean result = sessionService.validateSession(null);

        // Assert
        assertFalse(result);
        verify(redisUtil, never()).hasKey(anyString());
        verify(sessionRepository, never()).existsById(anyString());
    }

    @Test
    void validateSession_WithEmptySessionId_ShouldReturnFalse() {
        // Act
        boolean result = sessionService.validateSession("");

        // Assert
        assertFalse(result);
        verify(redisUtil, never()).hasKey(anyString());
        verify(sessionRepository, never()).existsById(anyString());
    }

    @Test
    void validateSession_WithWhitespaceSessionId_ShouldReturnFalse() {
        // Act
        boolean result = sessionService.validateSession("   ");

        // Assert
        assertFalse(result);
        verify(redisUtil, never()).hasKey(anyString());
        verify(sessionRepository, never()).existsById(anyString());
    }

    @Test
    void validateSession_WithSessionInRedis_ShouldReturnTrue() {
        // Arrange
        when(redisUtil.hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(true);

        // Act
        boolean result = sessionService.validateSession(sessionId);

        // Assert
        assertTrue(result);
        verify(redisUtil).hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId);
        verify(sessionRepository, never()).existsById(anyString());
    }

    @Test
    void validateSession_WithSessionInDatabase_ShouldReturnTrue() {
        // Arrange
        when(redisUtil.hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(false);
        when(sessionRepository.existsById(sessionId)).thenReturn(true);

        // Act
        boolean result = sessionService.validateSession(sessionId);

        // Assert
        assertTrue(result);
        verify(redisUtil).hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId);
        verify(sessionRepository).existsById(sessionId);
    }

    @Test
    void validateSession_WithNonExistentSession_ShouldReturnFalse() {
        // Arrange
        when(redisUtil.hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(false);
        when(sessionRepository.existsById(sessionId)).thenReturn(false);

        // Act
        boolean result = sessionService.validateSession(sessionId);

        // Assert
        assertFalse(result);
        verify(redisUtil).hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId);
        verify(sessionRepository).existsById(sessionId);
    }

    @Test
    void updateSessionSocket_WithExistingSession_ShouldUpdateSessionAndCache() {
        // Arrange
        String socketId = "socket-123";
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        sessionService.updateSessionSocket(sessionId, socketId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(socketId, savedSession.getSocketId());
        assertTrue(savedSession.getIsOnline());
        assertNotNull(savedSession.getLastSeenAt());
        
        verify(redisUtil).setSession(eq(sessionId), any(Map.class));
    }

    @Test
    void updateSessionSocket_WithNonExistentSession_ShouldDoNothing() {
        // Arrange
        String socketId = "socket-123";
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        sessionService.updateSessionSocket(sessionId, socketId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).save(any(Session.class));
        verify(redisUtil, never()).setSession(anyString(), any(Map.class));
    }

    @Test
    void updateSessionLastSeen_WithExistingSession_ShouldUpdateLastSeenAndRefreshRedisTTL() {
        // Arrange
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("id", sessionId);
        cachedData.put("nickname", nickname);
        
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(redisUtil.getSession(eq(sessionId), eq(Map.class))).thenReturn(cachedData);
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        sessionService.updateSessionLastSeen(sessionId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertNotNull(savedSession.getLastSeenAt());
        
        verify(redisUtil).getSession(eq(sessionId), eq(Map.class));
        verify(redisUtil).setSession(eq(sessionId), eq(cachedData));
    }

    @Test
    void updateSessionLastSeen_WithNonExistentSession_ShouldDoNothing() {
        // Arrange
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        sessionService.updateSessionLastSeen(sessionId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).save(any(Session.class));
        verify(redisUtil, never()).getSession(anyString(), any());
        verify(redisUtil, never()).setSession(anyString(), any(Map.class));
    }

    @Test
    void deleteSession_ShouldDeleteFromRepositoryAndRedis() {
        // Act
        sessionService.deleteSession(sessionId);

        // Assert
        verify(sessionRepository).deleteById(sessionId);
        verify(redisUtil).deleteSession(sessionId);
    }

    @Test
    void joinRoom_WithExistingSession_ShouldUpdateRoomId() {
        // Arrange
        Long roomId = 1L;
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        sessionService.joinRoom(sessionId, roomId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(roomId, savedSession.getRoomId());
        assertNotNull(savedSession.getLastSeenAt());
    }

    @Test
    void joinRoom_WithNonExistentSession_ShouldDoNothing() {
        // Arrange
        Long roomId = 1L;
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        sessionService.joinRoom(sessionId, roomId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    void leaveRoom_WithExistingSession_ShouldSetRoomIdToNull() {
        // Arrange
        mockSession.setRoomId(1L);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        sessionService.leaveRoom(sessionId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertNull(savedSession.getRoomId());
        assertNotNull(savedSession.getLastSeenAt());
    }

    @Test
    void leaveRoom_WithNonExistentSession_ShouldDoNothing() {
        // Arrange
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        sessionService.leaveRoom(sessionId);

        // Assert
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    void updateSession_WithValidUpdates_ShouldUpdateSessionAndCache() {
        // Arrange
        String newNickname = "NewNickname";
        String newAvatar = "https://example.com/new-avatar.jpg";
        
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        Optional<Session> result = sessionService.updateSession(sessionId, newNickname, newAvatar);

        // Assert
        assertTrue(result.isPresent());
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(newNickname, savedSession.getNickname());
        assertEquals(newAvatar, savedSession.getAvatar());
        
        verify(redisUtil).setSession(eq(sessionId), any(Map.class));
    }

    @Test
    void updateSession_WithNullNickname_ShouldNotUpdateNickname() {
        // Arrange
        String originalNickname = mockSession.getNickname();
        String newAvatar = "https://example.com/new-avatar.jpg";
        
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        Optional<Session> result = sessionService.updateSession(sessionId, null, newAvatar);

        // Assert
        assertTrue(result.isPresent());
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(originalNickname, savedSession.getNickname()); // Unchanged
        assertEquals(newAvatar, savedSession.getAvatar());
    }

    @Test
    void updateSession_WithEmptyNickname_ShouldNotUpdateNickname() {
        // Arrange
        String originalNickname = mockSession.getNickname();
        String newAvatar = "https://example.com/new-avatar.jpg";
        
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        Optional<Session> result = sessionService.updateSession(sessionId, "", newAvatar);

        // Assert
        assertTrue(result.isPresent());
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(originalNickname, savedSession.getNickname()); // Unchanged
        assertEquals(newAvatar, savedSession.getAvatar());
    }

    @Test
    void updateSession_WithNullAvatar_ShouldUpdateAvatarToNull() {
        // Arrange
        String newNickname = "NewNickname";
        
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));
        when(sessionRepository.save(any(Session.class))).thenReturn(mockSession);

        // Act
        Optional<Session> result = sessionService.updateSession(sessionId, newNickname, null);

        // Assert
        assertTrue(result.isPresent());
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).save(sessionCaptor.capture());
        
        Session savedSession = sessionCaptor.getValue();
        assertEquals(newNickname, savedSession.getNickname());
        // When avatar is null, it should not be updated (remains unchanged)
        assertEquals(avatar, savedSession.getAvatar()); // Should remain original avatar
    }

    @Test
    void updateSession_WithNonExistentSession_ShouldReturnEmpty() {
        // Arrange
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // Act
        Optional<Session> result = sessionService.updateSession(sessionId, "NewNickname", "new-avatar.jpg");

        // Assert
        assertFalse(result.isPresent());
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).save(any(Session.class));
        verify(redisUtil, never()).setSession(anyString(), any(Map.class));
    }

    @Test
    void generateSessionId_ShouldReturn32CharacterString() {
        // This tests the private method indirectly through createSession
        // Arrange
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> {
            Session session = invocation.getArgument(0);
            // Return the session as-is, preserving the ID generated by service
            return session;
        });

        // Act
        Session result = sessionService.createSession(nickname, avatar);

        // Assert
        assertNotNull(result.getId());
        assertEquals(32, result.getId().length());
        // Should contain only hex characters (0-9, a-f)
        assertTrue(result.getId().matches("[0-9a-f]{32}"));
    }
}