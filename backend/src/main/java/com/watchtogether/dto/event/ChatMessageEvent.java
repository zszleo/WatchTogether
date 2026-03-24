package com.watchtogether.dto.event;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "聊天消息事件")
public class ChatMessageEvent {

    @Schema(description = "房间代码", example = "abc123")
    private String roomCode;

    @Schema(description = "消息内容", example = "大家好！")
    private String message;

    @Schema(description = "发送者昵称", example = "张三")
    private String sender;

    @Schema(description = "发送者会话ID")
    private String senderId;

    @Schema(description = "消息类型: text, image, danmaku", example = "text")
    private String type;

    @Schema(description = "弹幕颜色(仅danmaku类型)", example = "#FFFFFF")
    private String color;
}