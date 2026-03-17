package com.watchtogether.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisHealthCheck {

    private static final Logger logger = LoggerFactory.getLogger(RedisHealthCheck.class);

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisHealthCheck(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkRedisConnection() {
        try {
            // Try to ping Redis
            redisTemplate.getConnectionFactory().getConnection().ping();
            logger.info("Redis connection successful");
        } catch (Exception e) {
            logger.error("Redis connection failed: {}", e.getMessage());
            logger.warn("Application will continue but Redis features may not work properly");
        }
    }
}