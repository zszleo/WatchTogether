package com.watchtogether.dto.resp;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "会话响应信息")
public class SessionResp {

    @Schema(description = "会话ID", example = "sess_abc123def456")
    private String id;
    @Schema(description = "用户昵称", example = "张三")
    private String nickname;
    @Schema(description = "头像URL", example = "avatar1.png")
    private String avatar;
    @Schema(description = "是否在线", example = "true")
    private Boolean isOnline;
    
    @Schema(description = "当前所在房间码", example = "ABC123")
    private String roomCode;
    
    @Schema(description = "创建时间", example = "2026-03-06T11:30:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "最后活动时间", example = "2026-03-06T11:35:00")
    private LocalDateTime lastSeenAt;
}