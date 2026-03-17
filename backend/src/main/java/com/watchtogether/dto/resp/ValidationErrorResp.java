package com.watchtogether.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Map;

@Data
@Schema(description = "验证错误响应")
public class ValidationErrorResp {

    @Schema(description = "字段错误映射")
    private Map<String, String> fieldErrors;
}