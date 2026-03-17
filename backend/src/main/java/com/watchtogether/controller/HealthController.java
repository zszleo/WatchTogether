package com.watchtogether.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.HealthCheckResp;
import com.watchtogether.dto.resp.SimpleHealthResp;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/health")
@Tag(name = "健康检查", description = "系统健康状态检查相关的API")
public class HealthController {

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public HealthController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    @Operation(
        summary = "系统健康检查",
        description = "检查系统及依赖服务（Redis）的健康状态"
    )
    public ResponseEntity<ApiResp<HealthCheckResp>> healthCheck() {
        HealthCheckResp healthData = new HealthCheckResp();
        healthData.setStatus("UP");
        healthData.setTimestamp(LocalDateTime.now());
        
        // Check Redis connectivity
        boolean redisHealthy = false;
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            redisHealthy = true;
        } catch (Exception e) {
            // Redis not available
        }
        healthData.setRedis(redisHealthy ? "UP" : "DOWN");
        
        ApiResp<HealthCheckResp> response = ApiResp.success("System status", healthData);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/simple")
    @Operation(
        summary = "简单健康检查",
        description = "返回简单的系统健康状态，不包含依赖服务检查"
    )
    public ResponseEntity<SimpleHealthResp> simpleHealth() {
        SimpleHealthResp response = new SimpleHealthResp();
        response.setStatus("UP");
        response.setService("WatchTogether Backend");
        response.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}