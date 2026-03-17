package com.watchtogether.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class RedisUtilTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private RedisUtil redisUtil;

    @Captor
    private ArgumentCaptor<String> keyCaptor;

    @Captor
    private ArgumentCaptor<Object> valueCaptor;

    @Captor
    private ArgumentCaptor<Long> ttlCaptor;

    @Captor
    private ArgumentCaptor<TimeUnit> timeUnitCaptor;

    private String testKey;
    private String testValue;
    private String sessionId;
    private String roomId;
    private String userId;

    @BeforeEach
    void setUp() {
        testKey = "test:key";
        testValue = "test value";
        sessionId = "session-123";
        roomId = "room-456";
        userId = "user-789";

        // Setup ValueOperations mock with lenient to avoid unnecessary stubbing errors
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void set_WithTTL_ShouldCallRedisTemplateWithTTL() {
        // Arrange
        long ttlSeconds = 3600L;

        // Act
        redisUtil.set(testKey, testValue, ttlSeconds);

        // Assert
        verify(valueOperations).set(eq(testKey), eq(testValue), eq(ttlSeconds), eq(TimeUnit.SECONDS));
    }

    @Test
    void set_WithoutTTL_ShouldCallRedisTemplateWithoutTTL() {
        // Act
        redisUtil.set(testKey, testValue);

        // Assert
        verify(valueOperations).set(eq(testKey), eq(testValue));
        verify(valueOperations, never()).set(anyString(), any(), anyLong(), any(TimeUnit.class));
    }

    @Test
    void get_ShouldReturnValueFromRedisTemplate() {
        // Arrange
        when(valueOperations.get(testKey)).thenReturn(testValue);

        // Act
        Object result = redisUtil.get(testKey);

        // Assert
        assertEquals(testValue, result);
        verify(valueOperations).get(testKey);
    }

    @Test
    void get_WithType_ShouldReturnTypedValue() {
        // Arrange
        when(valueOperations.get(testKey)).thenReturn(testValue);

        // Act
        String result = redisUtil.get(testKey, String.class);

        // Assert
        assertEquals(testValue, result);
        verify(valueOperations).get(testKey);
    }

    @Test
    void get_WithType_WhenValueIsWrongType_ShouldReturnNull() {
        // Arrange
        Integer wrongTypeValue = 123;
        when(valueOperations.get(testKey)).thenReturn(wrongTypeValue);

        // Act
        String result = redisUtil.get(testKey, String.class);

        // Assert
        assertNull(result);
        verify(valueOperations).get(testKey);
    }

    @Test
    void get_WithType_WhenValueIsNull_ShouldReturnNull() {
        // Arrange
        when(valueOperations.get(testKey)).thenReturn(null);

        // Act
        String result = redisUtil.get(testKey, String.class);

        // Assert
        assertNull(result);
        verify(valueOperations).get(testKey);
    }

    @Test
    void delete_ShouldCallRedisTemplateDelete() {
        // Arrange
        when(redisTemplate.delete(testKey)).thenReturn(true);

        // Act
        Boolean result = redisUtil.delete(testKey);

        // Assert
        assertTrue(result);
        verify(redisTemplate).delete(testKey);
    }

    @Test
    void hasKey_ShouldCallRedisTemplateHasKey() {
        // Arrange
        when(redisTemplate.hasKey(testKey)).thenReturn(true);

        // Act
        Boolean result = redisUtil.hasKey(testKey);

        // Assert
        assertTrue(result);
        verify(redisTemplate).hasKey(testKey);
    }

    @Test
    void getExpire_ShouldCallRedisTemplateGetExpire() {
        // Arrange
        when(redisTemplate.getExpire(testKey, TimeUnit.SECONDS)).thenReturn(3600L);

        // Act
        Long result = redisUtil.getExpire(testKey);

        // Assert
        assertEquals(3600L, result);
        verify(redisTemplate).getExpire(testKey, TimeUnit.SECONDS);
    }

    @Test
    void expire_ShouldCallRedisTemplateExpire() {
        // Arrange
        when(redisTemplate.expire(testKey, 3600L, TimeUnit.SECONDS)).thenReturn(true);

        // Act
        Boolean result = redisUtil.expire(testKey, 3600L);

        // Assert
        assertTrue(result);
        verify(redisTemplate).expire(testKey, 3600L, TimeUnit.SECONDS);
    }

    @Test
    void setSession_ShouldSetWithSessionKeyPrefixAndTTL() {
        // Arrange
        Object sessionData = "session data";

        // Act
        redisUtil.setSession(sessionId, sessionData);

        // Assert
        verify(valueOperations).set(
            eq(RedisUtil.KEY_PREFIX_SESSION + sessionId),
            eq(sessionData),
            eq(RedisUtil.TTL_SESSION),
            eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void getSession_ShouldGetWithSessionKeyPrefix() {
        // Arrange
        Object sessionData = "session data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(sessionData);

        // Act
        Object result = redisUtil.getSession(sessionId);

        // Assert
        assertEquals(sessionData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_SESSION + sessionId);
    }

    @Test
    void getSession_WithType_ShouldGetTypedSession() {
        // Arrange
        String sessionData = "session data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(sessionData);

        // Act
        String result = redisUtil.getSession(sessionId, String.class);

        // Assert
        assertEquals(sessionData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_SESSION + sessionId);
    }

    @Test
    void deleteSession_ShouldDeleteWithSessionKeyPrefix() {
        // Arrange
        when(redisTemplate.delete(RedisUtil.KEY_PREFIX_SESSION + sessionId)).thenReturn(true);

        // Act
        Boolean result = redisUtil.deleteSession(sessionId);

        // Assert
        assertTrue(result);
        verify(redisTemplate).delete(RedisUtil.KEY_PREFIX_SESSION + sessionId);
    }

    @Test
    void setRoom_ShouldSetWithRoomKeyPrefixAndTTL() {
        // Arrange
        Object roomData = "room data";

        // Act
        redisUtil.setRoom(roomId, roomData);

        // Assert
        verify(valueOperations).set(
            eq(RedisUtil.KEY_PREFIX_ROOM + roomId),
            eq(roomData),
            eq(RedisUtil.TTL_ROOM),
            eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void getRoom_ShouldGetWithRoomKeyPrefix() {
        // Arrange
        Object roomData = "room data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_ROOM + roomId)).thenReturn(roomData);

        // Act
        Object result = redisUtil.getRoom(roomId);

        // Assert
        assertEquals(roomData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_ROOM + roomId);
    }

    @Test
    void getRoom_WithType_ShouldGetTypedRoom() {
        // Arrange
        String roomData = "room data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_ROOM + roomId)).thenReturn(roomData);

        // Act
        String result = redisUtil.getRoom(roomId, String.class);

        // Assert
        assertEquals(roomData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_ROOM + roomId);
    }

    @Test
    void deleteRoom_ShouldDeleteWithRoomKeyPrefix() {
        // Arrange
        when(redisTemplate.delete(RedisUtil.KEY_PREFIX_ROOM + roomId)).thenReturn(true);

        // Act
        Boolean result = redisUtil.deleteRoom(roomId);

        // Assert
        assertTrue(result);
        verify(redisTemplate).delete(RedisUtil.KEY_PREFIX_ROOM + roomId);
    }

    @Test
    void setRoomUsers_ShouldSetWithRoomUsersKeyPrefixAndTTL() {
        // Arrange
        Object usersData = "users data";

        // Act
        redisUtil.setRoomUsers(roomId, usersData);

        // Assert
        verify(valueOperations).set(
            eq(RedisUtil.KEY_PREFIX_ROOM_USERS + roomId),
            eq(usersData),
            eq(RedisUtil.TTL_ROOM_USERS),
            eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void getRoomUsers_ShouldGetWithRoomUsersKeyPrefix() {
        // Arrange
        Object usersData = "users data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_ROOM_USERS + roomId)).thenReturn(usersData);

        // Act
        Object result = redisUtil.getRoomUsers(roomId);

        // Assert
        assertEquals(usersData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_ROOM_USERS + roomId);
    }

    @Test
    void setRoomPlayback_ShouldSetWithRoomPlaybackKeyPrefixAndTTL() {
        // Arrange
        Object playbackData = "playback data";

        // Act
        redisUtil.setRoomPlayback(roomId, playbackData);

        // Assert
        verify(valueOperations).set(
            eq(RedisUtil.KEY_PREFIX_ROOM_PLAYBACK + roomId),
            eq(playbackData),
            eq(RedisUtil.TTL_ROOM_PLAYBACK),
            eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void getRoomPlayback_ShouldGetWithRoomPlaybackKeyPrefix() {
        // Arrange
        Object playbackData = "playback data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_ROOM_PLAYBACK + roomId)).thenReturn(playbackData);

        // Act
        Object result = redisUtil.getRoomPlayback(roomId);

        // Assert
        assertEquals(playbackData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_ROOM_PLAYBACK + roomId);
    }

    @Test
    void setUserSessions_ShouldSetWithUserSessionsKeyPrefixAndTTL() {
        // Arrange
        Object sessionsData = "sessions data";

        // Act
        redisUtil.setUserSessions(userId, sessionsData);

        // Assert
        verify(valueOperations).set(
            eq(RedisUtil.KEY_PREFIX_USER_SESSIONS + userId),
            eq(sessionsData),
            eq(RedisUtil.TTL_SESSION),
            eq(TimeUnit.SECONDS)
        );
    }

    @Test
    void getUserSessions_ShouldGetWithUserSessionsKeyPrefix() {
        // Arrange
        Object sessionsData = "sessions data";
        when(valueOperations.get(RedisUtil.KEY_PREFIX_USER_SESSIONS + userId)).thenReturn(sessionsData);

        // Act
        Object result = redisUtil.getUserSessions(userId);

        // Assert
        assertEquals(sessionsData, result);
        verify(valueOperations).get(RedisUtil.KEY_PREFIX_USER_SESSIONS + userId);
    }

    @Test
    void constants_ShouldHaveCorrectValues() {
        // Test key prefixes
        assertEquals("session:", RedisUtil.KEY_PREFIX_SESSION);
        assertEquals("room:", RedisUtil.KEY_PREFIX_ROOM);
        assertEquals("room:users:", RedisUtil.KEY_PREFIX_ROOM_USERS);
        assertEquals("room:playback:", RedisUtil.KEY_PREFIX_ROOM_PLAYBACK);
        assertEquals("user:sessions:", RedisUtil.KEY_PREFIX_USER_SESSIONS);
        assertEquals("socket:", RedisUtil.KEY_PREFIX_SOCKET);

        // Test TTL constants
        assertEquals(7 * 24 * 60 * 60L, RedisUtil.TTL_SESSION); // 7 days
        assertEquals(24 * 60 * 60L, RedisUtil.TTL_ROOM); // 24 hours
        assertEquals(30 * 60L, RedisUtil.TTL_ROOM_USERS); // 30 minutes
        assertEquals(5 * 60L, RedisUtil.TTL_ROOM_PLAYBACK); // 5 minutes
    }

    @Test
    void set_WithTTL_ShouldHandleZeroTTL() {
        // Act
        redisUtil.set(testKey, testValue, 0L);

        // Assert
        verify(valueOperations).set(eq(testKey), eq(testValue), eq(0L), eq(TimeUnit.SECONDS));
    }

    @Test
    void set_WithTTL_ShouldHandleNegativeTTL() {
        // Act
        redisUtil.set(testKey, testValue, -1L);

        // Assert
        verify(valueOperations).set(eq(testKey), eq(testValue), eq(-1L), eq(TimeUnit.SECONDS));
    }

    @Test
    void expire_WithZeroTTL_ShouldCallRedisTemplate() {
        // Arrange
        when(redisTemplate.expire(testKey, 0L, TimeUnit.SECONDS)).thenReturn(true);

        // Act
        Boolean result = redisUtil.expire(testKey, 0L);

        // Assert
        assertTrue(result);
        verify(redisTemplate).expire(testKey, 0L, TimeUnit.SECONDS);
    }

    @Test
    void get_WhenRedisTemplateReturnsNull_ShouldReturnNull() {
        // Arrange
        when(valueOperations.get(testKey)).thenReturn(null);

        // Act
        Object result = redisUtil.get(testKey);

        // Assert
        assertNull(result);
        verify(valueOperations).get(testKey);
    }

    @Test
    void delete_WhenKeyDoesNotExist_ShouldReturnFalse() {
        // Arrange
        when(redisTemplate.delete(testKey)).thenReturn(false);

        // Act
        Boolean result = redisUtil.delete(testKey);

        // Assert
        assertFalse(result);
        verify(redisTemplate).delete(testKey);
    }

    @Test
    void hasKey_WhenKeyDoesNotExist_ShouldReturnFalse() {
        // Arrange
        when(redisTemplate.hasKey(testKey)).thenReturn(false);

        // Act
        Boolean result = redisUtil.hasKey(testKey);

        // Assert
        assertFalse(result);
        verify(redisTemplate).hasKey(testKey);
    }

    @Test
    void getExpire_WhenKeyDoesNotExist_ShouldReturnNegativeValue() {
        // Arrange
        when(redisTemplate.getExpire(testKey, TimeUnit.SECONDS)).thenReturn(-2L);

        // Act
        Long result = redisUtil.getExpire(testKey);

        // Assert
        assertEquals(-2L, result);
        verify(redisTemplate).getExpire(testKey, TimeUnit.SECONDS);
    }

    @Test
    void expire_WhenKeyDoesNotExist_ShouldReturnFalse() {
        // Arrange
        when(redisTemplate.expire(testKey, 3600L, TimeUnit.SECONDS)).thenReturn(false);

        // Act
        Boolean result = redisUtil.expire(testKey, 3600L);

        // Assert
        assertFalse(result);
        verify(redisTemplate).expire(testKey, 3600L, TimeUnit.SECONDS);
    }
}