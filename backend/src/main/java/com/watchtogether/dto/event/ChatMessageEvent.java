package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "聊天消息事件")
public class ChatMessageEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomId;

    @Schema(description = "消息内容", example = "大家好！")
    private String message;

    @Schema(description = "发送者", example = "张三")
    private String sender;
}