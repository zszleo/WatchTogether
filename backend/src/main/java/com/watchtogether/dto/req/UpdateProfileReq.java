package com.watchtogether.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "更新用户资料请求参数")
public class UpdateProfileReq {

    @Size(min = 1, max = 50, message = "Nickname must be between 1 and 50 characters")
    @Schema(description = "用户昵称", example = "张三")
    private String nickname;

    @Size(max = 200, message = "Avatar URL must be less than 200 characters")
    @Schema(description = "头像URL", example = "avatar1.png")
    private String avatar;
}