package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.FileUploadResp;
import com.watchtogether.dto.resp.FileInfoResp;
import com.watchtogether.service.FileService;
import com.watchtogether.service.SessionService;
import com.watchtogether.annotation.SessionId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/files")
@Tag(name = "文件上传", description = "视频和文件上传相关的API")
public class FileController {

    private final FileService fileService;
    private final SessionService sessionService;

    @Value("${app.upload.allowed-extensions:.mp4,.webm,.mkv,.mov,.avi}")
    private String allowedExtensions;

    @Value("${app.upload.max-size-mb:100}")
    private int maxSizeMb;

    @Autowired
    public FileController(FileService fileService, SessionService sessionService) {
        this.fileService = fileService;
        this.sessionService = sessionService;
    }

    @PostMapping("/upload")
    @Operation(
        summary = "上传文件",
        description = "上传视频或其他文件，支持的文件类型：.mp4, .webm, .mkv, .mov, .avi，最大100MB"
    )
    public ResponseEntity<ApiResp<FileUploadResp>> uploadFile(
            @RequestParam("file") 
            @Parameter(
                description = "上传的文件",
                required = true,
                schema = @Schema(type = "string", format = "binary")
            )
            MultipartFile file,
            @RequestParam(value = "type", defaultValue = "video") 
            @Parameter(description = "文件类型（video/image等）", example = "video") 
            String type,
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId) {

        if (file.isEmpty()) {
            return new ResponseEntity<>(ApiResp.badRequest("File is empty"), HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > maxSizeMb * 1024 * 1024) {
            return new ResponseEntity<>(ApiResp.badRequest("File size exceeds " + maxSizeMb + "MB limit"), HttpStatus.BAD_REQUEST);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return new ResponseEntity<>(ApiResp.badRequest("Invalid file name"), HttpStatus.BAD_REQUEST);
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        List<String> allowed = Arrays.asList(allowedExtensions.split(","));

        if (!allowed.contains(extension.toLowerCase())) {
            return new ResponseEntity<>(ApiResp.badRequest("File type not allowed. Allowed: " + allowedExtensions), HttpStatus.BAD_REQUEST);
        }

        try {
            String fileId = UUID.randomUUID().toString();
            String savedPath = fileService.saveFile(file, fileId, type);
            
            FileUploadResp result = new FileUploadResp();
            result.setFileId(fileId);
            result.setFilename(originalFilename);
            result.setUrl(savedPath);
            result.setSize(file.getSize());
            result.setType(type);
            
            return new ResponseEntity<>(ApiResp.success(result), HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(ApiResp.error("Failed to save file: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{fileId}")
    @Operation(
        summary = "获取文件信息",
        description = "根据文件ID获取文件详细信息"
    )
    public ResponseEntity<ApiResp<FileInfoResp>> getFileInfo(
            @PathVariable 
            @Parameter(description = "文件ID", example = "550e8400-e29b-41d4-a716-446655440000") 
            String fileId,
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId) {

        FileInfoResp fileInfo = fileService.getFileInfo(fileId);
        if (fileInfo == null) {
            return new ResponseEntity<>(ApiResp.notFound("File not found"), HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok(ApiResp.success(fileInfo));
    }

    @DeleteMapping("/{fileId}")
    @Operation(
        summary = "删除文件",
        description = "根据文件ID删除文件，需要文件所有者权限"
    )
    public ResponseEntity<ApiResp<Void>> deleteFile(
            @PathVariable 
            @Parameter(description = "文件ID", example = "550e8400-e29b-41d4-a716-446655440000") 
            String fileId,
            @SessionId
            @Parameter(description = "用户会话ID（必须为文件所有者）", example = "sess_abc123def456") 
            String sessionId) {

        boolean deleted = fileService.deleteFile(fileId, sessionId);
        if (!deleted) {
            return new ResponseEntity<>(ApiResp.notFound("File not found or access denied"), HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok(ApiResp.success("File deleted successfully", null));
    }
}
