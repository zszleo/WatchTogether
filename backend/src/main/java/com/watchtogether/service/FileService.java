package com.watchtogether.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.DirectoryStream;
import com.watchtogether.dto.resp.FileInfoResp;

@Slf4j
@Service
public class FileService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public String saveFile(MultipartFile file, String fileId, String type) throws IOException {
        String subDir = type.equals("emoji") ? "emojis" : "videos";
        Path uploadPath = Paths.get(uploadDir, subDir);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String extension = "";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String filename = fileId + extension;
        Path filePath = uploadPath.resolve(filename);
        
        Files.copy(file.getInputStream(), filePath);
        
        log.info("Saved file {} to {}", filename, filePath);
        
        return "/api/file/" + fileId + "/raw";
    }

    private Path findActualPath(String fileId) {
        Path videosDir = Paths.get(uploadDir, "videos");
        Path emojisDir = Paths.get(uploadDir, "emojis");
        
        // First try exact match (no extension)
        Path exactVideoPath = videosDir.resolve(fileId);
        Path exactEmojiPath = emojisDir.resolve(fileId);
        if (Files.exists(exactVideoPath)) {
            return exactVideoPath;
        }
        if (Files.exists(exactEmojiPath)) {
            return exactEmojiPath;
        }
        
        // Then try with any extension
        try {
            if (Files.exists(videosDir)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(videosDir, fileId + ".*")) {
                    for (Path path : stream) {
                        if (Files.isRegularFile(path)) {
                            return path;
                        }
                    }
                }
            }
            if (Files.exists(emojisDir)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(emojisDir, fileId + ".*")) {
                    for (Path path : stream) {
                        if (Files.isRegularFile(path)) {
                            return path;
                        }
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Error finding file for {}: {}", fileId, e.getMessage());
        }
        return null;
    }

    public FileInfoResp getFileInfo(String fileId) {
        Path actualPath = findActualPath(fileId);
        if (actualPath == null) {
            return null;
        }
        
        String type = actualPath.getParent().endsWith("videos") ? "video" : "emoji";
        
        FileInfoResp info = new FileInfoResp();
        info.setFileId(fileId);
        info.setPath(actualPath.toString());
        info.setType(type);
        
        try {
            info.setSize(Files.size(actualPath));
        } catch (IOException e) {
            log.warn("Could not get file size for {}", fileId);
            info.setSize(0L);
        }
        
        return info;
    }

    public boolean deleteFile(String fileId, String sessionId) {
        Path actualPath = findActualPath(fileId);
        if (actualPath == null) {
            return false;
        }
        
        try {
            Files.delete(actualPath);
            log.info("Deleted file {} from {}", fileId, actualPath);
            return true;
        } catch (IOException e) {
            log.error("Failed to delete file {}: {}", fileId, e.getMessage());
            return false;
        }
    }

    public byte[] getFileContent(String fileId) throws IOException {
        Path actualPath = findActualPath(fileId);
        if (actualPath == null) {
            return null;
        }
        
        return Files.readAllBytes(actualPath);
    }
}
