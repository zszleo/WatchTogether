package com.watchtogether.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisUtil {

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisUtil(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Key prefixes
    public static final String KEY_PREFIX_SESSION = "session:";
    public static final String KEY_PREFIX_ROOM = "room:";
    public static final String KEY_PREFIX_ROOM_USERS = "room:users:";
    public static final String KEY_PREFIX_ROOM_PLAYBACK = "room:playback:";
    public static final String KEY_PREFIX_USER_SESSIONS = "user:sessions:";
    public static final String KEY_PREFIX_SOCKET = "socket:";

    // TTL constants (seconds)
    public static final long TTL_SESSION = 7 * 24 * 60 * 60; // 7 days
    public static final long TTL_ROOM = 24 * 60 * 60; // 24 hours
    public static final long TTL_ROOM_USERS = 30 * 60; // 30 minutes
    public static final long TTL_ROOM_PLAYBACK = 5 * 60; // 5 minutes

    /**
     * Set value with TTL
     */
    public void set(String key, Object value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }

    /**
     * Set value without TTL
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * Get value by key
     */
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Get value by key with type
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        Object value = redisTemplate.opsForValue().get(key);
        return clazz.isInstance(value) ? (T) value : null;
    }

    /**
     * Delete key
     */
    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }

    /**
     * Check if key exists
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * Get TTL for key
     */
    public Long getExpire(String key) {
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }

    /**
     * Set TTL for key
     */
    public Boolean expire(String key, long ttlSeconds) {
        return redisTemplate.expire(key, ttlSeconds, TimeUnit.SECONDS);
    }

    // Session related methods
    public void setSession(String sessionId, Object sessionData) {
        set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
    }

    public Object getSession(String sessionId) {
        return get(KEY_PREFIX_SESSION + sessionId);
    }

    public <T> T getSession(String sessionId, Class<T> clazz) {
        return get(KEY_PREFIX_SESSION + sessionId, clazz);
    }

    public Boolean deleteSession(String sessionId) {
        return delete(KEY_PREFIX_SESSION + sessionId);
    }

    // Room related methods
    public void setRoom(String roomId, Object roomData) {
        set(KEY_PREFIX_ROOM + roomId, roomData, TTL_ROOM);
    }

    public Object getRoom(String roomId) {
        return get(KEY_PREFIX_ROOM + roomId);
    }

    public <T> T getRoom(String roomId, Class<T> clazz) {
        return get(KEY_PREFIX_ROOM + roomId, clazz);
    }

    public Boolean deleteRoom(String roomId) {
        return delete(KEY_PREFIX_ROOM + roomId);
    }

    // Room users methods
    public void setRoomUsers(String roomId, Object usersData) {
        set(KEY_PREFIX_ROOM_USERS + roomId, usersData, TTL_ROOM_USERS);
    }

    public Object getRoomUsers(String roomId) {
        return get(KEY_PREFIX_ROOM_USERS + roomId);
    }

    // Room playback state methods
    public void setRoomPlayback(String roomId, Object playbackData) {
        set(KEY_PREFIX_ROOM_PLAYBACK + roomId, playbackData, TTL_ROOM_PLAYBACK);
    }

    public Object getRoomPlayback(String roomId) {
        return get(KEY_PREFIX_ROOM_PLAYBACK + roomId);
    }

    // User sessions methods
    public void setUserSessions(String userId, Object sessionsData) {
        set(KEY_PREFIX_USER_SESSIONS + userId, sessionsData, TTL_SESSION);
    }

    public Object getUserSessions(String userId) {
        return get(KEY_PREFIX_USER_SESSIONS + userId);
    }
}