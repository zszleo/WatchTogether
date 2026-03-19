package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.req.AddUserEmojiReq;
import com.watchtogether.model.Emoji;
import com.watchtogether.service.EmojiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmojiControllerTest {

    @Mock
    private EmojiService emojiService;

    @InjectMocks
    private EmojiController emojiController;

    private Emoji defaultEmoji;
    private Emoji userEmoji;

    @BeforeEach
    void setUp() {
        defaultEmoji = new Emoji();
        defaultEmoji.setId(1L);
        defaultEmoji.setName("smile");
        defaultEmoji.setType("unicode");
        defaultEmoji.setUnicode("😊");
        defaultEmoji.setIsDefault(true);

        userEmoji = new Emoji();
        userEmoji.setId(2L);
        userEmoji.setName("custom");
        userEmoji.setType("image");
        userEmoji.setUrl("/api/file/abc123/raw");
        userEmoji.setNickname("testuser");
        userEmoji.setIsDefault(false);
    }

    @Test
    void getDefaultEmojis_ShouldReturnAllDefaultEmojis() {
        List<Emoji> emojis = Arrays.asList(defaultEmoji);
        when(emojiService.getDefaultEmojis()).thenReturn(emojis);

        ResponseEntity<ApiResp<List<Emoji>>> response = emojiController.getDefaultEmojis();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
    }

    @Test
    void getEmojisByNickname_WithValidNickname_ShouldReturnUserEmojis() {
        String nickname = "testuser";
        List<Emoji> emojis = Arrays.asList(userEmoji);
        
        when(emojiService.getEmojisByNickname(nickname)).thenReturn(emojis);

        ResponseEntity<ApiResp<List<Emoji>>> response = emojiController.getEmojisByNickname(nickname);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
    }

    @Test
    void getEmojisByNickname_WithNoEmojis_ShouldReturnEmptyList() {
        String nickname = "testuser";
        
        when(emojiService.getEmojisByNickname(nickname)).thenReturn(Arrays.asList());

        ResponseEntity<ApiResp<List<Emoji>>> response = emojiController.getEmojisByNickname(nickname);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertTrue(response.getBody().getData().isEmpty());
    }

    @Test
    void addEmojiByNickname_WithValidRequest_ShouldReturnCreated() {
        String nickname = "testuser";
        AddUserEmojiReq request = new AddUserEmojiReq();
        request.setName("my_emoji");
        request.setType("image");

        when(emojiService.addEmojiByNickname(eq(nickname), eq("my_emoji"), eq("image"), any()))
            .thenReturn(userEmoji);

        ResponseEntity<ApiResp<Emoji>> response = emojiController.addEmojiByNickname(nickname, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void addEmojiByNickname_WithMissingName_ShouldReturnBadRequest() {
        String nickname = "testuser";
        AddUserEmojiReq request = new AddUserEmojiReq();
        request.setType("image");

        ResponseEntity<ApiResp<Emoji>> response = emojiController.addEmojiByNickname(nickname, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void addEmojiByNickname_WithMissingType_ShouldReturnBadRequest() {
        String nickname = "testuser";
        AddUserEmojiReq request = new AddUserEmojiReq();
        request.setName("my_emoji");

        ResponseEntity<ApiResp<Emoji>> response = emojiController.addEmojiByNickname(nickname, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void deleteEmojiByNickname_WithValidNicknameAndOwnEmoji_ShouldDelete() {
        String nickname = "testuser";
        Long emojiId = 2L;

        when(emojiService.deleteEmojiByNickname(emojiId, nickname)).thenReturn(true);

        ResponseEntity<ApiResp<Void>> response = emojiController.deleteEmojiByNickname(nickname, emojiId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void deleteEmojiByNickname_WithNonExistentEmoji_ShouldReturnNotFound() {
        String nickname = "testuser";
        Long emojiId = 999L;

        when(emojiService.deleteEmojiByNickname(emojiId, nickname)).thenReturn(false);

        ResponseEntity<ApiResp<Void>> response = emojiController.deleteEmojiByNickname(nickname, emojiId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
