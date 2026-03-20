package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频播放事件")
public class VideoPlayEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomCode;

    @Schema(description = "播放时间（秒）", example = "120.5")
    private Double time;
}