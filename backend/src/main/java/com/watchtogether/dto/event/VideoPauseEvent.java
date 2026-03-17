package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频暂停事件")
public class VideoPauseEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomId;
}