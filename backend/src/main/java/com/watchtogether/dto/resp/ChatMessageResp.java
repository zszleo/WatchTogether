package com.watchtogether.dto.resp;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "聊天消息响应信息")
public class ChatMessageResp {

    @Schema(description = "消息ID", example = "1")
    private Long id;
    
    @Schema(description = "房间ID", example = "123")
    private Long roomId;
    
    @Schema(description = "会话ID", example = "sess_abc123def456")
    private String sessionId;
    
    @Schema(description = "消息内容", example = "这是一条测试消息")
    private String content;
    
    @Schema(description = "消息类型", example = "text")
    private String messageType;
    
    @Schema(description = "创建时间", example = "2026-03-06T11:30:00")
    private LocalDateTime createdAt;
}
