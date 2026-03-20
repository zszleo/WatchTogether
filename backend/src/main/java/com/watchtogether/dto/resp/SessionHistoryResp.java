package com.watchtogether.dto.resp;

import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "会话历史记录响应对象")
public class SessionHistoryResp {

    @Schema(description = "历史记录ID", example = "1234567890")
    public Long id;

    @Schema(description = "会话ID", example = "sess_abc123def456")
    public String sessionId;

    @Schema(description = "房间邀请码", example = "ABC123")
    public String roomCode;

    @Schema(description = "房间名称", example = "ABC123")
    public String roomName;

    @Schema(description = "视频标题", example = "ABC123")
    public String videoTitle;

    @Schema(description = "加入时间", example = "2026-03-06T12:00:00")
    public LocalDateTime joinedAt;

   @Schema(description = "离开时间", example = "2026-03-06T12:00:00")
    public LocalDateTime leftAt;
}