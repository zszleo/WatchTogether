package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "视频URL变更事件")
public class VideoUrlChangeEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomId;

    @Schema(description = "视频URL", example = "https://example.com/video.mp4")
    private String url;
}