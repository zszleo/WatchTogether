package com.watchtogether.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.FileUploadResp;
import com.watchtogether.dto.resp.FileInfoResp;
import com.watchtogether.service.FileService;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FileController.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FileService fileService;

    @MockBean
    private SessionService sessionService;

    private String validSessionId = "session-12345678901234567890123456789012";
    private MockMultipartFile mockFile;
    private FileUploadResp mockFileUploadResp;
    private FileInfoResp mockFileInfoResp;

    @BeforeEach
    void setUp() {
        // Create a mock multipart file
        mockFile = new MockMultipartFile(
            "file",
            "test-video.mp4",
            "video/mp4",
            "test video content".getBytes()
        );

        // Mock file upload response
        mockFileUploadResp = new FileUploadResp();
        mockFileUploadResp.setFileId("550e8400-e29b-41d4-a716-446655440000");
        mockFileUploadResp.setFilename("test-video.mp4");
        mockFileUploadResp.setUrl("/api/files/550e8400-e29b-41d4-a716-446655440000");
        mockFileUploadResp.setSize(1024L);
        mockFileUploadResp.setType("video");

        // Mock file info response
        mockFileInfoResp = new FileInfoResp();
        mockFileInfoResp.setFileId("550e8400-e29b-41d4-a716-446655440000");
        mockFileInfoResp.setPath("/api/files/550e8400-e29b-41d4-a716-446655440000");
        mockFileInfoResp.setSize(1024L);
        mockFileInfoResp.setType("video");
    }

    @Test
    void uploadFile_WithValidFileAndSession_ShouldReturnCreated() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenReturn("/api/files/550e8400-e29b-41d4-a716-446655440000");

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fileId", notNullValue()))
                .andExpect(jsonPath("$.data.filename", is("test-video.mp4")))
                .andExpect(jsonPath("$.data.type", is("video")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithEmptyFile_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file",
            "empty.mp4",
            "video/mp4",
            new byte[0]
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(emptyFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File is empty")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void uploadFile_WithFileExceedingSizeLimit_ShouldReturnBadRequest() throws Exception {
        // Arrange
        // Create a large file (assuming max size is 100MB)
        byte[] largeContent = new byte[101 * 1024 * 1024]; // 101MB
        MockMultipartFile largeFile = new MockMultipartFile(
            "file",
            "large.mp4",
            "video/mp4",
            largeContent
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(largeFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File size exceeds")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void uploadFile_WithInvalidFileExtension_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile invalidFile = new MockMultipartFile(
            "file",
            "test.exe",
            "application/octet-stream",
            "malicious content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(invalidFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File type not allowed")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void uploadFile_WithNullFileName_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile nullNameFile = new MockMultipartFile(
            "file",
            null,
            "video/mp4",
            "content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(nullNameFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", anyOf(containsString("Invalid file name"), containsString("File must have an extension"))));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void uploadFile_WithFileNameEndingWithDot_ShouldReturnBadRequest() throws Exception {
        // Arrange
        MockMultipartFile dotEndingFile = new MockMultipartFile(
            "file",
            "test.",
            "video/mp4",
            "content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(dotEndingFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File extension cannot be empty")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void uploadFile_WithUpperCaseExtension_ShouldBeAccepted() throws Exception {
        // Arrange
        MockMultipartFile upperCaseFile = new MockMultipartFile(
            "file",
            "test.MP4",
            "video/mp4",
            "content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenReturn("/api/files/550e8400-e29b-41d4-a716-446655440000");

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(upperCaseFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithMultipleDotsInFilename_ShouldExtractLastExtension() throws Exception {
        // Arrange
        MockMultipartFile multiDotFile = new MockMultipartFile(
            "file",
            "my.video.test.mp4",
            "video/mp4",
            "content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenReturn("/api/files/550e8400-e29b-41d4-a716-446655440000");

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(multiDotFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.filename", is("my.video.test.mp4")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithMixedCaseAllowedExtensions_ShouldHandleCaseInsensitive() throws Exception {
        // Arrange
        MockMultipartFile mixedCaseFile = new MockMultipartFile(
            "file",
            "test.Mp4",
            "video/mp4",
            "content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenReturn("/api/files/550e8400-e29b-41d4-a716-446655440000");

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(mixedCaseFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithFileServiceIOException_ShouldReturnInternalServerError() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenThrow(new java.io.IOException("Disk full"));

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Failed to save file")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithDefaultType_ShouldUseVideoType() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), anyString()))
                .thenReturn("/api/files/550e8400-e29b-41d4-a716-446655440000");

        // Act & Assert - don't provide type parameter
        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated());

        // Should default to "video" type
        verify(fileService).saveFile(any(), anyString(), eq("video"));
    }

    @Test
    void uploadFile_WithInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(mockFile)
                        .param("type", "video")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid session")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).saveFile(any(), anyString(), anyString());
    }

    @Test
    void getFileInfo_WithExistingFile_ShouldReturnFileInfo() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.getFileInfo("550e8400-e29b-41d4-a716-446655440000"))
                .thenReturn(mockFileInfoResp);

        // Act & Assert
        mockMvc.perform(get("/api/files/550e8400-e29b-41d4-a716-446655440000")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fileId", is("550e8400-e29b-41d4-a716-446655440000")))
                .andExpect(jsonPath("$.data.path", is("/api/files/550e8400-e29b-41d4-a716-446655440000")))
                .andExpect(jsonPath("$.data.type", is("video")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).getFileInfo("550e8400-e29b-41d4-a716-446655440000");
    }

    @Test
    void getFileInfo_WithNonExistentFile_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.getFileInfo("non-existent-file"))
                .thenReturn(null);

        // Act & Assert
        mockMvc.perform(get("/api/files/non-existent-file")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File not found")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).getFileInfo("non-existent-file");
    }

    @Test
    void getFileInfo_WithInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/files/550e8400-e29b-41d4-a716-446655440000")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid session")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).getFileInfo(anyString());
    }

    @Test
    void deleteFile_WithOwnerSession_ShouldDeleteSuccessfully() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.deleteFile("550e8400-e29b-41d4-a716-446655440000", validSessionId))
                .thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/files/550e8400-e29b-41d4-a716-446655440000")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("File deleted successfully")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).deleteFile("550e8400-e29b-41d4-a716-446655440000", validSessionId);
    }

    @Test
    void deleteFile_WithNonExistentFile_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.deleteFile("non-existent-file", validSessionId))
                .thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/files/non-existent-file")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File not found or access denied")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService).deleteFile("non-existent-file", validSessionId);
    }

    @Test
    void deleteFile_WithNonOwnerSession_ShouldReturnNotFound() throws Exception {
        // Arrange
        String otherSessionId = "other-session-456";
        when(sessionService.validateSession(otherSessionId)).thenReturn(true);
        when(fileService.deleteFile("550e8400-e29b-41d4-a716-446655440000", otherSessionId))
                .thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/files/550e8400-e29b-41d4-a716-446655440000")
                        .header("X-Session-Id", otherSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("File not found or access denied")));

        verify(sessionService).validateSession(otherSessionId);
        verify(fileService).deleteFile("550e8400-e29b-41d4-a716-446655440000", otherSessionId);
    }

    @Test
    void deleteFile_WithInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/files/550e8400-e29b-41d4-a716-446655440000")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid session")));

        verify(sessionService).validateSession(validSessionId);
        verify(fileService, never()).deleteFile(anyString(), anyString());
    }

    @Test
    void uploadFile_WithEmojiType_ShouldSaveToEmojisDirectory() throws Exception {
        // Arrange
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "smile.mp4",
            "video/mp4",
            "emoji content".getBytes()
        );

        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(fileService.saveFile(any(), anyString(), eq("emoji")))
                .thenReturn("/api/files/emoji-123");

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                        .file(emojiFile)
                        .param("type", "emoji")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.type", is("emoji")));

        verify(fileService).saveFile(any(), anyString(), eq("emoji"));
    }
}