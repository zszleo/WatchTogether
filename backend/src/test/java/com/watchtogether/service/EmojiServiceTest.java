package com.watchtogether.service;

import com.watchtogether.model.Emoji;
import com.watchtogether.repository.EmojiRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmojiServiceTest {

    @Mock
    private EmojiRepository emojiRepository;

    @InjectMocks
    private EmojiService emojiService;

    @Captor
    private ArgumentCaptor<Emoji> emojiCaptor;

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
        userEmoji.setName("my_emoji");
        userEmoji.setType("image");
        userEmoji.setUrl("/api/files/abc123/raw");
        userEmoji.setSessionId("session-123");
        userEmoji.setIsDefault(false);
    }

    @Test
    void getDefaultEmojis_ShouldReturnAllDefaultEmojisSorted() {
        List<Emoji> emojis = Arrays.asList(
            createEmoji(1L, "smile", "unicode", "😊", true),
            createEmoji(2L, "laugh", "unicode", "😂", true),
            createEmoji(3L, "cry", "unicode", "😭", true)
        );
        when(emojiRepository.findByIsDefaultTrueOrderByNameAsc()).thenReturn(emojis);

        List<Emoji> result = emojiService.getDefaultEmojis();

        assertEquals(3, result.size());
        assertEquals("smile", result.get(0).getName());
        assertEquals("laugh", result.get(1).getName());
        verify(emojiRepository).findByIsDefaultTrueOrderByNameAsc();
    }

    @Test
    void getDefaultEmojis_WithEmptyDatabase_ShouldReturnEmptyList() {
        when(emojiRepository.findByIsDefaultTrueOrderByNameAsc()).thenReturn(List.of());

        List<Emoji> result = emojiService.getDefaultEmojis();

        assertTrue(result.isEmpty());
        verify(emojiRepository).findByIsDefaultTrueOrderByNameAsc();
    }

    @Test
    void getUserEmojis_ShouldReturnUserCustomEmojis() {
        String sessionId = "session-123";
        List<Emoji> userEmojis = Arrays.asList(
            createEmoji(1L, "custom1", "image", null, false),
            createEmoji(2L, "custom2", "image", null, false)
        );
        when(emojiRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(userEmojis);

        List<Emoji> result = emojiService.getUserEmojis(sessionId);

        assertEquals(2, result.size());
        assertFalse(result.get(0).getIsDefault());
        verify(emojiRepository).findBySessionIdOrderByCreatedAtDesc(sessionId);
    }

    @Test
    void getUserEmojis_WithNoCustomEmojis_ShouldReturnEmptyList() {
        String sessionId = "session-123";
        when(emojiRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(List.of());

        List<Emoji> result = emojiService.getUserEmojis(sessionId);

        assertTrue(result.isEmpty());
    }

    @Test
    void addUserEmoji_WithValidData_ShouldSaveAndReturn() {
        String sessionId = "session-123";
        String name = "my_emoji";
        String type = "image";
        String url = "/api/files/abc123/raw";

        when(emojiRepository.save(any(Emoji.class))).thenAnswer(invocation -> {
            Emoji e = invocation.getArgument(0);
            e.setId(1L);
            return e;
        });

        Emoji result = emojiService.addUserEmoji(sessionId, name, type, url);

        assertNotNull(result);
        assertEquals(name, result.getName());
        assertEquals(type, result.getType());
        assertEquals(url, result.getUrl());
        assertEquals(sessionId, result.getSessionId());
        assertFalse(result.getIsDefault());

        verify(emojiRepository).save(emojiCaptor.capture());
        Emoji saved = emojiCaptor.getValue();
        assertEquals(name, saved.getName());
        assertEquals(type, saved.getType());
    }

    @Test
    void addUserEmoji_WithUnicodeType_ShouldSaveSuccessfully() {
        String sessionId = "session-123";
        when(emojiRepository.save(any(Emoji.class))).thenAnswer(inv -> {
            Emoji e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        Emoji result = emojiService.addUserEmoji(sessionId, "laugh", "unicode", "😂");

        assertNotNull(result);
        assertEquals("unicode", result.getType());
        verify(emojiRepository).save(any(Emoji.class));
    }

    @Test
    void deleteUserEmoji_WithExistingEmoji_ShouldDeleteSuccessfully() {
        Long emojiId = 1L;
        String sessionId = "session-123";
        when(emojiRepository.findByIdAndSessionId(emojiId, sessionId)).thenReturn(Optional.of(userEmoji));

        boolean result = emojiService.deleteUserEmoji(emojiId, sessionId);

        assertTrue(result);
        verify(emojiRepository).delete(userEmoji);
    }

    @Test
    void deleteUserEmoji_WithNonExistentEmoji_ShouldReturnFalse() {
        Long emojiId = 999L;
        String sessionId = "session-123";
        when(emojiRepository.findByIdAndSessionId(emojiId, sessionId)).thenReturn(Optional.empty());

        boolean result = emojiService.deleteUserEmoji(emojiId, sessionId);

        assertFalse(result);
        verify(emojiRepository, never()).delete(any());
    }

    @Test
    void deleteUserEmoji_WithWrongSessionId_ShouldReturnFalse() {
        Long emojiId = 1L;
        String sessionId = "session-123";
        String wrongSessionId = "session-456";
        when(emojiRepository.findByIdAndSessionId(emojiId, wrongSessionId)).thenReturn(Optional.empty());

        boolean result = emojiService.deleteUserEmoji(emojiId, wrongSessionId);

        assertFalse(result);
        verify(emojiRepository, never()).delete(any());
    }

    @Test
    void getEmojiById_WithExistingId_ShouldReturnEmoji() {
        Long emojiId = 1L;
        when(emojiRepository.findById(emojiId)).thenReturn(Optional.of(defaultEmoji));

        Optional<Emoji> result = emojiService.getEmojiById(emojiId);

        assertTrue(result.isPresent());
        assertEquals(emojiId, result.get().getId());
        verify(emojiRepository).findById(emojiId);
    }

    @Test
    void getEmojiById_WithNonExistentId_ShouldReturnEmpty() {
        Long emojiId = 999L;
        when(emojiRepository.findById(emojiId)).thenReturn(Optional.empty());

        Optional<Emoji> result = emojiService.getEmojiById(emojiId);

        assertFalse(result.isPresent());
    }

    private Emoji createEmoji(Long id, String name, String type, String unicode, boolean isDefault) {
        Emoji emoji = new Emoji();
        emoji.setId(id);
        emoji.setName(name);
        emoji.setType(type);
        emoji.setUnicode(unicode);
        emoji.setIsDefault(isDefault);
        if (!isDefault) {
            emoji.setSessionId("session-123");
        }
        return emoji;
    }
}
