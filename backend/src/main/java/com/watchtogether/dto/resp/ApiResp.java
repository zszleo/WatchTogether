package com.watchtogether.dto.resp;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "通用API响应包装类")
public class ApiResp<T> {

    @Schema(description = "请求是否成功", example = "true")
    private boolean success;
    
    @Schema(description = "响应消息", example = "操作成功")
    private String message;
    
    @Schema(description = "响应数据")
    private T data;
    
    @Schema(description = "响应时间戳", example = "2026-03-06T11:30:00")
    private LocalDateTime timestamp;

    private ApiResp(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResp<T> success(T data) {
        return new ApiResp<>(true, "Success", data);
    }

    public static <T> ApiResp<T> success(String message, T data) {
        return new ApiResp<>(true, message, data);
    }

    public static <T> ApiResp<T> error(String message) {
        return new ApiResp<>(false, message, null);
    }

    public static <T> ApiResp<T> created(T data) {
        return new ApiResp<>(true, "Created successfully", data);
    }

    public static <T> ApiResp<T> notFound(String message) {
        return new ApiResp<>(false, message, null);
    }

    public static <T> ApiResp<T> unauthorized(String message) {
        return new ApiResp<>(false, message, null);
    }

    public static <T> ApiResp<T> forbidden(String message) {
        return new ApiResp<>(false, message, null);
    }

    public static <T> ApiResp<T> badRequest(String message) {
        return new ApiResp<>(false, message, null);
    }

    public static <T> ApiResp<T> validationError(String message, T validationErrors) {
        return new ApiResp<>(false, message, validationErrors);
    }
}