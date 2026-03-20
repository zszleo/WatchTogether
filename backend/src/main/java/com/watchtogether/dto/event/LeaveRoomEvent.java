package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "离开房间事件")
public class LeaveRoomEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomCode;
}