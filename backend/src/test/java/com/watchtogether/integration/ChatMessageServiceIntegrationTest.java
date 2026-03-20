package com.watchtogether.integration;

import com.watchtogether.config.SocketIOStartup;
import com.watchtogether.config.TestRedisConfig;
import com.watchtogether.dto.resp.ChatMessageResp;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.service.ChatMessageService;
import com.watchtogether.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
@Transactional
class ChatMessageServiceIntegrationTest {

    @MockBean
    private SocketIOStartup socketIOStartup;

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private RoomService roomService;

    private Long roomId;
    private String sessionId;

    @BeforeEach
    void setUp() {
        sessionId = "session-user-123";
        roomId = roomService.createRoom(
            new com.watchtogether.dto.req.CreateRoomReq() {{
                setName("Test Room");
                setIsPublic(true);
            }},
            sessionId
        ).getId();
    }

    @Test
    void saveMessage_WithTextType_ShouldPersistMessage() {
        String content = "Hello, World!";
        String messageType = "text";

        ChatMessage result = chatMessageService.saveMessage(roomId, sessionId, content, messageType);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(roomId, result.getRoomId());
        assertEquals(sessionId, result.getSessionId());
        assertEquals(content, result.getContent());
        assertEquals(messageType, result.getMessageType());
        assertNotNull(result.getCreatedAt());

        ChatMessage persisted = chatMessageRepository.findById(result.getId()).orElse(null);
        assertNotNull(persisted);
        assertEquals(content, persisted.getContent());
    }

    @Test
    void saveMessage_WithNullMessageType_ShouldDefaultToText() {
        ChatMessage result = chatMessageService.saveMessage(roomId, sessionId, "Test message", null);

        assertEquals("text", result.getMessageType());
    }

    @Test
    void saveMessage_WithEmojiType_ShouldPersistMessage() {
        String content = "🎉🎊";
        String messageType = "emoji";

        ChatMessage result = chatMessageService.saveMessage(roomId, sessionId, content, messageType);

        assertNotNull(result);
        assertEquals(content, result.getContent());
        assertEquals(messageType, result.getMessageType());
    }

    @Test
    void getChatMessages_WithMessages_ShouldReturnPaginatedResults() throws InterruptedException {
        for (int i = 0; i < 5; i++) {
            chatMessageService.saveMessage(roomId, sessionId, "Message " + i, "text");
            Thread.sleep(10);
        }

        List<ChatMessageResp> result = chatMessageService.getChatMessages(roomId, 0, 10);

        assertThat(result).hasSize(5);
    }

    @Test
    void getChatMessages_ShouldBeOrderedByCreatedAtDescending() throws InterruptedException {
        chatMessageService.saveMessage(roomId, sessionId, "First", "text");
        Thread.sleep(10);
        chatMessageService.saveMessage(roomId, sessionId, "Second", "text");
        Thread.sleep(10);
        chatMessageService.saveMessage(roomId, sessionId, "Third", "text");

        List<ChatMessageResp> result = chatMessageService.getChatMessages(roomId, 0, 10);

        assertThat(result).hasSize(3);
        assertEquals("Third", result.get(0).getContent());
        assertEquals("Second", result.get(1).getContent());
        assertEquals("First", result.get(2).getContent());
    }

    @Test
    void getChatMessages_WithPagination_ShouldRespectPageSize() {
        for (int i = 0; i < 10; i++) {
            chatMessageService.saveMessage(roomId, sessionId, "Message " + i, "text");
        }

        List<ChatMessageResp> page0 = chatMessageService.getChatMessages(roomId, 0, 3);
        List<ChatMessageResp> page1 = chatMessageService.getChatMessages(roomId, 1, 3);

        assertThat(page0).hasSize(3);
        assertThat(page1).hasSize(3);
    }

    @Test
    void getChatMessages_WithNoMessages_ShouldReturnEmptyList() {
        List<ChatMessageResp> result = chatMessageService.getChatMessages(roomId, 0, 10);

        assertThat(result).isEmpty();
    }

    @Test
    void getChatMessages_WithInvalidPageParams_ShouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            chatMessageService.getChatMessages(roomId, -1, 10);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            chatMessageService.getChatMessages(roomId, 0, 0);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            chatMessageService.getChatMessages(roomId, 0, 101);
        });
    }

    @Test
    void saveMessage_WithLongContent_ShouldPersist() {
        String longContent = "A".repeat(1000);

        ChatMessage result = chatMessageService.saveMessage(roomId, sessionId, longContent, "text");

        assertEquals(longContent, result.getContent());
    }

    @Test
    void getChatMessages_WithMessagesFromDifferentSessions_ShouldReturnAll() {
        String session1 = "session-1";
        String session2 = "session-2";
        String session3 = "session-3";

        chatMessageService.saveMessage(roomId, session1, "From session 1", "text");
        chatMessageService.saveMessage(roomId, session2, "From session 2", "text");
        chatMessageService.saveMessage(roomId, session3, "From session 3", "text");

        List<ChatMessageResp> result = chatMessageService.getChatMessages(roomId, 0, 10);

        assertThat(result).hasSize(3);
    }

    @Test
    void getChatMessages_WithMessagesFromDifferentRooms_ShouldOnlyReturnTargetRoom() {
        Long room2Id = roomService.createRoom(
            new com.watchtogether.dto.req.CreateRoomReq() {{
                setName("Another Room");
                setIsPublic(true);
            }},
            sessionId
        ).getId();

        chatMessageService.saveMessage(roomId, sessionId, "Room 1 message", "text");
        chatMessageService.saveMessage(room2Id, sessionId, "Room 2 message", "text");

        List<ChatMessageResp> room1Messages = chatMessageService.getChatMessages(roomId, 0, 10);
        List<ChatMessageResp> room2Messages = chatMessageService.getChatMessages(room2Id, 0, 10);

        assertThat(room1Messages).hasSize(1);
        assertThat(room1Messages.get(0).getContent()).isEqualTo("Room 1 message");
        assertThat(room2Messages).hasSize(1);
        assertThat(room2Messages.get(0).getContent()).isEqualTo("Room 2 message");
    }

    @Test
    void saveMessage_ShouldMapToResponseCorrectly() {
        ChatMessage saved = chatMessageService.saveMessage(roomId, sessionId, "Test content", "emoji");

        List<ChatMessageResp> messages = chatMessageService.getChatMessages(roomId, 0, 10);

        assertThat(messages).hasSize(1);
        ChatMessageResp resp = messages.get(0);
        assertEquals(saved.getId(), resp.getId());
        assertEquals(roomId, resp.getRoomCode());
        assertEquals(sessionId, resp.getSessionId());
        assertEquals("Test content", resp.getContent());
        assertEquals("emoji", resp.getMessageType());
        assertNotNull(resp.getCreatedAt());
    }
}