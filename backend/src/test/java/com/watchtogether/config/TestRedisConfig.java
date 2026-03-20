package com.watchtogether.config;

import com.watchtogether.utils.RedisUtil;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@TestConfiguration
public class TestRedisConfig {

    @Bean
    @Primary
    public RedisUtil redisUtil() {
        RedisUtil mockRedisUtil = Mockito.mock(RedisUtil.class);
        
        when(mockRedisUtil.getSession(anyString(), any())).thenReturn(null);
        when(mockRedisUtil.getRoom(anyString(), any())).thenReturn(null);
        when(mockRedisUtil.getRoomUsers(anyString())).thenReturn(null);
        when(mockRedisUtil.getRoomPlayback(anyString())).thenReturn(null);
        when(mockRedisUtil.hasKey(anyString())).thenReturn(false);
        
        doAnswer(invocation -> null).when(mockRedisUtil).setSession(anyString(), any());
        doAnswer(invocation -> null).when(mockRedisUtil).setRoom(anyString(), any());
        doAnswer(invocation -> null).when(mockRedisUtil).setRoomUsers(anyString(), any());
        doAnswer(invocation -> null).when(mockRedisUtil).setRoomPlayback(anyString(), any());
        doAnswer(invocation -> null).when(mockRedisUtil).delete(anyString());
        doAnswer(invocation -> null).when(mockRedisUtil).deleteRoom(anyString());
        doAnswer(invocation -> null).when(mockRedisUtil).deleteSession(anyString());
        
        return mockRedisUtil;
    }
}