package com.watchtogether.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Schema(description = "创建会话请求参数")
public class CreateSessionReq {

    @NotBlank(message = "Nickname is required")
    @Size(min = 1, max = 50, message = "Nickname must be between 1 and 50 characters")
    @Schema(description = "用户昵称", example = "张三", requiredMode = Schema.RequiredMode.REQUIRED)
    private String nickname;

    @Size(max = 200, message = "Avatar URL must be less than 200 characters")
    @Schema(description = "头像URL", example = "avatar1.png")
    private String avatar;
}