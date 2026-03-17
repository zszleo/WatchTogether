package com.watchtogether.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "文件信息响应")
public class FileInfoResp {

    @Schema(description = "文件ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private String fileId;

    @Schema(description = "文件路径", example = "./uploads/videos/550e8400-e29b-41d4-a716-446655440000.mp4")
    private String path;

    @Schema(description = "文件类型", example = "video")
    private String type;

    @Schema(description = "文件大小（字节）", example = "1024000")
    private Long size;
}