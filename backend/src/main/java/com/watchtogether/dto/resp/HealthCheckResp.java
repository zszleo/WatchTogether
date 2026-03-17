package com.watchtogether.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "系统健康检查响应")
public class HealthCheckResp {

    @Schema(description = "系统状态", example = "UP")
    private String status;

    @Schema(description = "检查时间戳", example = "2026-03-06T11:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "Redis服务状态", example = "UP")
    private String redis;
}