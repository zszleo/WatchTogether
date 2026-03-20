package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "加入房间事件")
public class JoinRoomEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomCode;

    @Schema(description = "会话ID", example = "sess_abc123def456")
    private String sessionId;
}