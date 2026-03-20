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

    @Test
    void saveFile_WithInvalidFileId_ShouldThrowException() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "video content".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "../etc/passwd", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "test<script>", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "test with spaces", "video"));
    }

    @Test
    void saveFile_WithInvalidType_ShouldThrowException() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "video content".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "valid-id", "invalid"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "valid-id", ""));
    }

    @Test
    void saveFile_WithInvalidExtension_ShouldThrowException() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.exe",
            "application/octet-stream",
            "malicious content".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "valid-id", "video"));
    }

    @Test
    void saveFile_WithValidIdAndType_ShouldSucceed() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "video content".getBytes()
        );

        String result = fileService.saveFile(file, "valid-id-123", "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("videos").resolve("valid-id-123.mp4")));
    }

    @Test
    void saveFile_WithVariousVideoExtensions_ShouldSucceed() throws IOException {
        String[] extensions = {"webm", "mkv", "mov", "avi"};
        for (String ext : extensions) {
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "test." + ext,
                "video/" + ext,
                "video content".getBytes()
            );
            String fileId = "video-" + ext;
            String result = fileService.saveFile(file, fileId, "video");
            assertNotNull(result);
            assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId + "." + ext)));
        }
    }

    @Test
    void saveFile_WithVariousImageExtensions_ShouldSucceed() throws IOException {
        String[] extensions = {"jpg", "gif", "jpeg", "png"};
        for (String ext : extensions) {
            MockMultipartFile file = new MockMultipartFile(
                "file",
                "test." + ext,
                "image/" + ext,
                "image content".getBytes()
            );
            String fileId = "emoji-" + ext;
            String result = fileService.saveFile(file, fileId, "emoji");
            assertNotNull(result);
            assertTrue(Files.exists(tempDir.resolve("emojis").resolve(fileId + "." + ext)));
        }
    }

    @Test
    void saveFile_WithJpegExtension_ShouldSucceed() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.jpeg",
            "image/jpeg",
            "image content".getBytes()
        );
        String fileId = "jpeg-test";
        String result = fileService.saveFile(file, fileId, "emoji");
        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("emojis").resolve(fileId + ".jpeg")));
    }

    @Test
    void getFileInfo_WithExistingEmojiFile_ShouldReturnInfo() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "emoji-info-id";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);

        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
        assertEquals("emoji", info.getType());
        assertNotNull(info.getSize());
    }

    @Test
    void deleteFile_WithExistingEmojiFile_ShouldDeleteSuccessfully() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "emoji-delete-id";
        fileService.saveFile(file, fileId, "emoji");

        boolean result = fileService.deleteFile(fileId, "session-123");

        assertTrue(result);
        assertFalse(Files.exists(tempDir.resolve("emojis").resolve(fileId + ".png")));
    }

    @Test
    void saveFile_WhenDirectoryDoesNotExist_ShouldCreateDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "newdir.mp4",
            "video/mp4",
            "video content".getBytes()
        );
        String fileId = "new-dir-video";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        Path videosDir = tempDir.resolve("videos");
        assertTrue(Files.exists(videosDir));
        assertTrue(Files.exists(videosDir.resolve(fileId + ".mp4")));
    }

    @Test
    void getFileInfo_WhenFileNotFound_ShouldReturnNull() {
        FileInfoResp info = fileService.getFileInfo("non-existent-file");
        assertNull(info);
    }

    @Test
    void getFileInfo_WithVideoFile_ShouldReturnVideoType() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "video-type-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);

        assertNotNull(info);
        assertEquals("video", info.getType());
        assertEquals("video-type-test", info.getFileId());
    }

    @Test
    void getFileInfo_WithEmojiFile_ShouldReturnEmojiType() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "emoji-type-test";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);

        assertNotNull(info);
        assertEquals("emoji", info.getType());
        assertEquals("emoji-type-test", info.getFileId());
    }

    @Test
    void deleteFile_WhenFileDeleted_ShouldReturnTrue() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "delete-verify-id";
        fileService.saveFile(file, fileId, "video");

        boolean result = fileService.deleteFile(fileId, "session-123");

        assertTrue(result);
    }

    @Test
    void saveFile_WithUppercaseExtension_ShouldNormalizeToLowercase() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.MP4",
            "video/mp4",
            "video content".getBytes()
        );
        String fileId = "uppercase-ext-id";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void saveFile_WithDotInFilename_ShouldSucceed() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "file.name.mp4",
            "video/mp4",
            "video content".getBytes()
        );
        String fileId = "dot-in-name-id";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void getFileContent_WhenFileNotFound_ShouldReturnNull() throws IOException {
        byte[] result = fileService.getFileContent("non-existent-file");
        assertNull(result);
    }

    @Test
    void findActualPath_WithExactEmojiMatch_ShouldReturnPath() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "exact-emoji-match";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
    }

    @Test
    void getFileContent_WithExistingVideo_ShouldReturnContent() throws IOException {
        byte[] content = "video test content".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            content
        );
        String fileId = "video-content-test";
        fileService.saveFile(file, fileId, "video");

        byte[] result = fileService.getFileContent(fileId);
        assertNotNull(result);
        assertArrayEquals(content, result);
    }

    @Test
    void getFileInfo_WithExactVideoMatch_ShouldReturnFromVideosDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "exact-match.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "exact-video-match";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
        assertEquals("video", info.getType());
    }

    @Test
    void getFileInfo_WithExactEmojiMatch_ShouldReturnFromEmojisDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "exact-emoji.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "exact-emoji-only";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
        assertEquals("emoji", info.getType());
    }

    @Test
    void getFileInfo_VideoExactMatchBeforeWildcard() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "search-order.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "search-order-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals("search-order-test", info.getFileId());
        assertEquals("video", info.getType());
    }

    @Test
    void getFileInfo_EmojiExactMatchBeforeWildcard() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji-search-order.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "emoji-search-order-test";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
        assertEquals("emoji", info.getType());
    }

    @Test
    void deleteFile_VideoExistsBeforeEmoji() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "priority-video.mp4",
            "video/mp4",
            "video content".getBytes()
        );
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "priority-emoji.png",
            "image/png",
            "emoji content".getBytes()
        );
        String videoId = "priority-video";
        String emojiId = "priority-emoji";
        fileService.saveFile(videoFile, videoId, "video");
        fileService.saveFile(emojiFile, emojiId, "emoji");

        FileInfoResp videoInfo = fileService.getFileInfo(videoId);
        FileInfoResp emojiInfo = fileService.getFileInfo(emojiId);

        assertEquals("video", videoInfo.getType());
        assertEquals("emoji", emojiInfo.getType());
    }

    @Test
    void getFileInfo_VideosDirectoryNotExists_ShouldReturnNull() {
        FileInfoResp info = fileService.getFileInfo("non-existent-in-empty-dir");
        assertNull(info);
    }

    @Test
    void getFileInfo_EmojisDirectoryNotExists_ShouldReturnNull() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.mp4",
            "video/mp4",
            "content".getBytes()
        );
        fileService.saveFile(file, "only-video", "video");
        
        FileInfoResp info = fileService.getFileInfo("only-video");
        assertNotNull(info);
        assertEquals("video", info.getType());
    }

    @Test
    void saveFile_ExtensionWithDot_ShouldExtractCorrectly() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "dotfile.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "dot-extraction-test";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        Path savedFile = tempDir.resolve("videos").resolve(fileId + ".mp4");
        assertTrue(Files.exists(savedFile));
    }

    @Test
    void saveFile_ExtensionBecomesLowercase() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "UPPERCASE.MP4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "lowercase-ext-test";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        Path savedFile = tempDir.resolve("videos").resolve(fileId + ".mp4");
        assertTrue(Files.exists(savedFile));
    }

    @Test
    void saveFile_InvalidExtensionDotExe_ShouldThrow() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "malicious.exe",
            "application/octet-stream",
            "dangerous".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "invalid-ext", "video"));
    }

    @Test
    void saveFile_InvalidExtensionZip_ShouldThrow() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "archive.zip",
            "application/zip",
            "data".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "zip-invalid", "video"));
    }

    @Test
    void saveFile_InvalidExtensionHtml_ShouldThrow() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "script.html",
            "text/html",
            "<script>alert(1)</script>".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "html-invalid", "video"));
    }

    @Test
    void saveFile_TypeEmojiSelectsEmojisDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji-type-dir.png",
            "image/png",
            "emoji content".getBytes()
        );
        String fileId = "emoji-dir-select-test";
        fileService.saveFile(file, fileId, "emoji");

        assertTrue(Files.exists(tempDir.resolve("emojis").resolve(fileId + ".png")));
        assertFalse(Files.exists(tempDir.resolve("videos").resolve(fileId + ".png")));
    }

    @Test
    void saveFile_TypeVideoSelectsVideosDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "video-type-dir.mp4",
            "video/mp4",
            "video content".getBytes()
        );
        String fileId = "video-dir-select-test";
        fileService.saveFile(file, fileId, "video");

        assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
        assertFalse(Files.exists(tempDir.resolve("emojis").resolve(fileId + ".mp4")));
    }

    @Test
    void saveFile_FileIdWithUnderscore_ShouldPass() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "underscore.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "file_id_with_underscore", "video");
        assertNotNull(result);
    }

    @Test
    void saveFile_FileIdWithHyphen_ShouldPass() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "hyphen.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "file-id-with-hyphen-123", "video");
        assertNotNull(result);
    }

    @Test
    void saveFile_FileIdWithNumbersOnly_ShouldPass() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "numbers.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "1234567890", "video");
        assertNotNull(result);
    }

    @Test
    void saveFile_FileIdWithLettersOnly_ShouldPass() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "letters.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "abcdefgh", "video");
        assertNotNull(result);
    }

    @Test
    void saveFile_FileIdWithMixedCase_ShouldPass() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "mixed.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "TestFile123_ABC", "video");
        assertNotNull(result);
    }

    @Test
    void saveFile_FileIdWithSpecialChars_ShouldThrow() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "special.mp4",
            "video/mp4",
            "content".getBytes()
        );
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file@id!", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file#id", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file$id", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file%id", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file&id", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file*id", "video"));
        assertThrows(IllegalArgumentException.class, () -> 
            fileService.saveFile(file, "file?id", "video"));
    }

    @Test
    void saveFile_ReturnPathFormat_ShouldBeCorrect() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "return.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "return-path-test";
        String result = fileService.saveFile(file, fileId, "video");

        assertEquals("/api/file/" + fileId + "/raw", result);
    }

    @Test
    void getFileInfo_FileSizeShouldBePositive() throws IOException {
        byte[] content = new byte[1024];
        java.util.Arrays.fill(content, (byte) 'A');
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "size.mp4",
            "video/mp4",
            content
        );
        String fileId = "size-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(1024L, info.getSize());
    }

    @Test
    void deleteFile_WithDifferentSessionId_ShouldStillDelete() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "delete-session.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "delete-session-test";
        fileService.saveFile(file, fileId, "video");

        boolean result = fileService.deleteFile(fileId, "session-456");

        assertTrue(result);
        assertFalse(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void deleteFile_FailsOnNonExistent_ShouldReturnFalse() {
        boolean result = fileService.deleteFile("completely-nonexistent-id-xyz", "session-123");
        assertFalse(result);
    }

    @Test
    void getFileContent_EmptyContent_ShouldReturnEmptyArray() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "empty.mp4",
            "video/mp4",
            new byte[0]
        );
        String fileId = "empty-content-test";
        fileService.saveFile(file, fileId, "video");

        byte[] result = fileService.getFileContent(fileId);
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    void getFileContent_VideoFileContentMatches() throws IOException {
        byte[] videoContent = "VIDEO_DATA_12345".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "content-verify.mp4",
            "video/mp4",
            videoContent
        );
        String fileId = "content-verify-test";
        fileService.saveFile(file, fileId, "video");

        byte[] result = fileService.getFileContent(fileId);
        assertEquals(new String(videoContent), new String(result));
    }

    @Test
    void getFileContent_EmojiFileContentMatches() throws IOException {
        byte[] emojiContent = "EMOJI_DATA_67890".getBytes();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji-content.png",
            "image/png",
            emojiContent
        );
        String fileId = "emoji-content-test";
        fileService.saveFile(file, fileId, "emoji");

        byte[] result = fileService.getFileContent(fileId);
        assertEquals(new String(emojiContent), new String(result));
    }

    @Test
    void findActualPath_VideoFoundFirstInExactMatch() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "first.mp4",
            "video/mp4",
            "video".getBytes()
        );
        String fileId = "find-first-test";
        fileService.saveFile(videoFile, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
    }

    @Test
    void findActualPath_EmojiFoundSecondInExactMatch() throws IOException {
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "second.png",
            "image/png",
            "emoji".getBytes()
        );
        String fileId = "find-second-test";
        fileService.saveFile(emojiFile, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
    }

    @Test
    void multipleFiles_SameIdDifferentTypes_ShouldBeIndependent() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "sameid.mp4",
            "video/mp4",
            "video".getBytes()
        );
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "sameid.png",
            "image/png",
            "emoji".getBytes()
        );
        String videoId = "shared-id-video";
        String emojiId = "shared-id-emoji";

        fileService.saveFile(videoFile, videoId, "video");
        fileService.saveFile(emojiFile, emojiId, "emoji");

        FileInfoResp videoInfo = fileService.getFileInfo(videoId);
        FileInfoResp emojiInfo = fileService.getFileInfo(emojiId);

        assertEquals("video", videoInfo.getType());
        assertEquals("emoji", emojiInfo.getType());
    }

    @Test
    void saveFile_CreateNestedStructure() throws IOException {
        ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.resolve("nested").resolve("path").toString());

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "nested.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "nested-test", "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("nested").resolve("path").resolve("videos").resolve("nested-test.mp4")));
    }

    @Test
    void getFileInfo_PathContainsFullPath() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "path.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "path-info-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info.getPath());
        assertTrue(info.getPath().contains("videos"));
        assertTrue(info.getPath().contains(fileId));
    }

    @Test
    void findActualPath_WildcardSearchInVideosDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "wildcard-search.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "wildcard-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals("video", info.getType());
    }

    @Test
    void findActualPath_WildcardSearchInEmojisDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "emoji-wildcard.png",
            "image/png",
            "content".getBytes()
        );
        String fileId = "emoji-wildcard-test";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals("emoji", info.getType());
    }

    @Test
    void findActualPath_BothDirectoriesExist_WildcardIteration() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "iterate.mp4",
            "video/mp4",
            "video".getBytes()
        );
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "iterate.png",
            "image/png",
            "emoji".getBytes()
        );
        fileService.saveFile(videoFile, "iterate-both", "video");
        fileService.saveFile(emojiFile, "iterate-both-emoji", "emoji");

        FileInfoResp videoInfo = fileService.getFileInfo("iterate-both");
        FileInfoResp emojiInfo = fileService.getFileInfo("iterate-both-emoji");

        assertEquals("video", videoInfo.getType());
        assertEquals("emoji", emojiInfo.getType());
    }

    @Test
    void findActualPath_VideosDirExists_EmojisDirNotExists() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "only-videos.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "only-videos-test";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals("video", info.getType());
    }

    @Test
    void findActualPath_BothDirsExist_EmojiOnly() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "both1.mp4",
            "video/mp4",
            "video".getBytes()
        );
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "both2.png",
            "image/png",
            "emoji".getBytes()
        );
        fileService.saveFile(videoFile, "both-exists", "video");
        fileService.saveFile(emojiFile, "both-exists-emoji", "emoji");

        FileInfoResp emojiInfo = fileService.getFileInfo("both-exists-emoji");
        assertEquals("emoji", emojiInfo.getType());
    }

    @Test
    void findActualPath_ReturnsFirstMatchingFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "first-match.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "first-match";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertNotNull(info.getPath());
    }

    @Test
    void findActualPath_DirectoryStreamIteration_VideoWildcard() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "stream-video.mp4",
            "video/mp4",
            "stream video content".getBytes()
        );
        String fileId = "stream-video";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
    }

    @Test
    void findActualPath_DirectoryStreamIteration_EmojiWildcard() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "stream-emoji.png",
            "image/png",
            "stream emoji content".getBytes()
        );
        String fileId = "stream-emoji";
        fileService.saveFile(file, fileId, "emoji");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertNotNull(info);
        assertEquals(fileId, info.getFileId());
    }

    @Test
    void saveFile_PathTraversalCheck_UploadPathStartsWithBase() throws IOException {
        ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "pathcheck.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "pathcheck", "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("videos").resolve("pathcheck.mp4")));
    }

    @Test
    void saveFile_FilePathCheck_ResolvedPathStartsWithUploadPath() throws IOException {
        ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "filecheck.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String result = fileService.saveFile(file, "filecheck", "video");

        assertNotNull(result);
        Path expectedPath = tempDir.resolve("videos").resolve("filecheck.mp4");
        assertTrue(Files.exists(expectedPath));
    }

    @Test
    void getFileInfo_ReturnsCorrectFileId() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "fileid.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "correct-file-id";
        fileService.saveFile(file, fileId, "video");

        FileInfoResp info = fileService.getFileInfo(fileId);
        assertEquals(fileId, info.getFileId());
    }

    @Test
    void getFileInfo_TypeDeterminedByParentDirectory() throws IOException {
        MockMultipartFile videoFile = new MockMultipartFile(
            "file",
            "parent-video.mp4",
            "video/mp4",
            "video".getBytes()
        );
        MockMultipartFile emojiFile = new MockMultipartFile(
            "file",
            "parent-emoji.png",
            "image/png",
            "emoji".getBytes()
        );
        fileService.saveFile(videoFile, "parent-video", "video");
        fileService.saveFile(emojiFile, "parent-emoji", "emoji");

        FileInfoResp videoInfo = fileService.getFileInfo("parent-video");
        FileInfoResp emojiInfo = fileService.getFileInfo("parent-emoji");

        assertTrue(videoInfo.getPath().contains("videos"));
        assertTrue(emojiInfo.getPath().contains("emojis"));
    }

    @Test
    void deleteFile_ReturnsTrueOnSuccessfulDeletion() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "delete-success.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "delete-success-test";
        fileService.saveFile(file, fileId, "video");

        boolean result = fileService.deleteFile(fileId, "any-session");

        assertTrue(result);
    }

    @Test
    void deleteFile_FileNoLongerExistsAfterDeletion() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "verify-delete.mp4",
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "verify-delete-test";
        fileService.saveFile(file, fileId, "video");

        fileService.deleteFile(fileId, "session");

        assertFalse(Files.exists(tempDir.resolve("videos").resolve(fileId + ".mp4")));
    }

    @Test
    void deleteFile_ReturnsFalseWhenFileNotFound() {
        boolean result = fileService.deleteFile("definitely-does-not-exist-12345", "session");
        assertFalse(result);
    }

    @Test
    void getFileContent_VideoContentIsCorrect() throws IOException {
        String expectedContent = "Test video content for verification";
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "verify-content.mp4",
            "video/mp4",
            expectedContent.getBytes()
        );
        String fileId = "verify-content-test";
        fileService.saveFile(file, fileId, "video");

        byte[] result = fileService.getFileContent(fileId);

        assertEquals(expectedContent, new String(result));
    }

    @Test
    void getFileContent_EmojiContentIsCorrect() throws IOException {
        String expectedContent = "PNG image data";
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "verify-emoji.png",
            "image/png",
            expectedContent.getBytes()
        );
        String fileId = "verify-emoji-test";
        fileService.saveFile(file, fileId, "emoji");

        byte[] result = fileService.getFileContent(fileId);

        assertEquals(expectedContent, new String(result));
    }

    @Test
    void getFileContent_ReturnsNullForNonExistent() throws IOException {
        byte[] result = fileService.getFileContent("non-existent-xyz-123");
        assertNull(result);
    }

    @Test
    void getFileInfo_ReturnsNullWhenActualPathIsNull() {
        FileInfoResp info = fileService.getFileInfo("null-path-test-xyz");
        assertNull(info);
    }

    @Test
    void saveFile_NullOriginalFilename_NoExtension() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            null,
            "video/mp4",
            "content".getBytes()
        );
        String fileId = "null-filename-test";
        String result = fileService.saveFile(file, fileId, "video");

        assertNotNull(result);
        assertTrue(Files.exists(tempDir.resolve("videos").resolve(fileId)));
    }
}
