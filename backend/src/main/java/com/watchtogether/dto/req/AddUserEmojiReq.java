package com.watchtogether.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "添加用户表情请求参数")
public class AddUserEmojiReq {

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters")
    @Schema(description = "表情名称", example = "大笑", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "Type is required")
    @Size(min = 1, max = 20, message = "Type must be between 1 and 20 characters")
    @Schema(description = "表情类型", example = "image", requiredMode = Schema.RequiredMode.REQUIRED)
    private String type;

    @Size(max = 2048, message = "URL must be less than 2048 characters")
    @Schema(description = "表情URL", example = "https://example.com/emoji.png")
    private String url;
}