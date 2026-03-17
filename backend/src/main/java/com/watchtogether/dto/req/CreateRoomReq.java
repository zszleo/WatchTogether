package com.watchtogether.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import io.swagger.v3.oas.annotations.media.Schema;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "创建房间请求参数")
public class CreateRoomReq {

    @NotBlank(message = "Room name is required")
    @Size(min = 1, max = 100, message = "Room name must be between 1 and 100 characters")
    @Schema(description = "房间名称", example = "电影之夜", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    @Schema(description = "房间描述", example = "一起观看最新电影")
    private String description;

    @Min(value = 1, message = "Maximum users must be at least 1")
    @Max(value = 50, message = "Maximum users cannot exceed 50")
    @Schema(description = "最大用户数", example = "10", defaultValue = "5")
    private Integer maxUsers = 5;

    @Schema(description = "是否公开房间", example = "true", defaultValue = "true")
    private Boolean isPublic = true;

    @Size(max = 2048, message = "Video URL must be less than 2048 characters")
    @Schema(description = "视频URL", example = "https://example.com/video.mp4")
    private String videoUrl;

    @Size(max = 200, message = "Video title must be less than 200 characters")
    @Schema(description = "视频标题", example = "精彩电影合集")
    private String videoTitle;
}