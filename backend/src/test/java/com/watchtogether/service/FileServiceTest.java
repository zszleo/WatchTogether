package com.watchtogether.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import com.watchtogether.dto.resp.FileInfoResp;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @InjectMocks
    private FileService fileService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.toString());
    }

    @Test
    void saveFile_WithVideoType_ShouldSaveToVideosDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "video content".getBytes()
        );

        String fileId = "test-video-id";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        assertTrue(result.contains("/api/file/"));
        assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void saveFile_WithEmojiType_ShouldSaveToEmojisDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji.png",
            "image/png",
            "image content".getBytes()
        );

        String fileId = "test-emoji-id";
        String result = fileService.saveFile(file, fileId, "emoji");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("emojis").resolve(fileId + ".png")));
    }

    @Test
    void saveFile_WithNoExtension_ShouldSaveWithoutExtension() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "noextension",
            "application/octet-stream",
            "content".getBytes()
        );

        String fileId = "no-ext-id";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
    }

    @Test
    void getFileInfo_WithExistingVideoFile_ShouldReturnInfo() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "content".getBytes()
        );

        String fileId = "info-test-id";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);

        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
        assertEquals("video", info.getType());
        assertNotNull(info.getSize());
    }

    @Test
    void getFileInfo_WithNonExistentFile_ShouldReturnNull() {
        FileInfoResp info = fileService.getFileInfo("non-existent-file");

        assertNull(info);
    }

    @Test
    void deleteFile_WithExistingFile_ShouldDeleteSuccessfully() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "delete.mp4",
            "video/mp4",
            "content".getBytes()
        );

        String fileId = "delete-test-id";
        fileService.saveFile(file, fileId, "video");

        boolean result = fileService.deleteFile(fileId, "session-123");

        assertTrue(result);
        assertFalse(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void deleteFile_WithNonExistentFile_ShouldReturnFalse() {
        boolean result = fileService.deleteFile("non-existent", "session-123");

        assertFalse(result);
    }

    @Test
    void getFileContent_WithExistingFile_ShouldReturnContent() throws IOException {
        byte[] content = "test content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "content.mp4",
            "video/mp4",
            content
        );

        String fileId = "content-id";
        fileService.saveFile(file, fileId, "video");

        byte[] result = fileService.getFileContent(fileId);

        assertNotNull(result);
        assertEquals(content.length, result.length);
    }

    @Test
    void getFileContent_WithNonExistentFile_ShouldReturnNull() throws IOException {
        byte[] result = fileService.getFileContent("non-existent");

        assertNull(result);
    }
}
