package com.watchtogether.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "文件上传响应")
public class FileUploadResp {

    @Schema(description = "文件ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String fileId;

    @Schema(description = "原始文件名", example = "video.mp4")
    private String filename;

    @Schema(description = "文件访问URL", example = "/api/file/550e8400-e29b-41d4-a716-446655440000/raw")
    private String url;

    @Schema(description = "文件大小（字节）", example = "1024000")
    private Long size;

    @Schema(description = "文件类型", example = "video")
    private String type;
}