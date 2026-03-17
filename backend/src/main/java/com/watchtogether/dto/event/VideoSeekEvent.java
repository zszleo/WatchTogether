package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频跳转事件")
public class VideoSeekEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomId;

    @Schema(description = "跳转时间（秒）", example = "300.0")
    private Double time;
}