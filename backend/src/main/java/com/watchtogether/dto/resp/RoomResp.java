package com.watchtogether.dto.resp;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "房间响应信息")
public class RoomResp {

    @Schema(description = "房间ID", example = "123")
    private Long id;
    
    @Schema(description = "房间邀请码", example = "ABC123")
    private String code;
    
    @Schema(description = "房间名称", example = "电影之夜")
    private String name;
    
    @Schema(description = "房间描述", example = "一起观看最新电影")
    private String description;
    
    @Schema(description = "最大用户数", example = "10")
    private Integer maxUsers;
    
    @Schema(description = "是否公开房间", example = "true")
    private Boolean isPublic;
    
    @Schema(description = "房主会话ID", example = "sess_abc123def456")
    private String ownerSessionId;
    
    @Schema(description = "视频URL", example = "https://example.com/video.mp4")
    private String videoUrl;
    
    @Schema(description = "视频标题", example = "精彩电影合集")
    private String videoTitle;
    
    @Schema(description = "视频时长（秒）", example = "3600")
    private Integer videoDuration;
    
    @Schema(description = "当前播放时间（秒）", example = "120.5")
    private Double currentPlaybackTime;
    
    @Schema(description = "是否正在播放", example = "true")
    private Boolean isPlaying;
    
    @Schema(description = "最后活动时间", example = "2026-03-06T11:30:00")
    private LocalDateTime lastActivityAt;
    
    @Schema(description = "创建时间", example = "2026-03-06T11:00:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "更新时间", example = "2026-03-06T11:30:00")
    private LocalDateTime updatedAt;

    // Additional fields for response
    @Schema(description = "在线用户数", example = "3")
    private Integer onlineUserCount;
    
    @Schema(description = "邀请链接", example = "https://watchtogether.com/join/ABC123")
    private String inviteLink;
}