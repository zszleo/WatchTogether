package com.watchtogether.service;

import com.watchtogether.dto.resp.ChatMessageResp;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.model.Room;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    private Long testRoomId;
    private String testSessionId;
    private String testSenderNickname;
    private String testContent;
    private ChatMessage testMessage;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        testRoomId = 1L;
        testSessionId = "session123";
        testSenderNickname = "TestUser";
        testContent = "Hello, world!";

        testMessage = new ChatMessage();
        testMessage.setId(100L);
        testMessage.setRoomId(testRoomId);
        testMessage.setSessionId(testSessionId);
        testMessage.setSenderNickname(testSenderNickname);
        testMessage.setContent(testContent);
        testMessage.setMessageType("text");
        testMessage.setCreatedAt(LocalDateTime.now());

        testRoom = new Room();
        testRoom.setId(testRoomId);
        testRoom.setCode("ROOM123");
        testRoom.setName("Test Room");
    }

    @Test
    void getChatMessages_shouldReturnMessagesWhenValidParameters() {
        // Given
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ChatMessage> messagePage = new PageImpl<>(Arrays.asList(testMessage), pageable, 1);

        when(chatMessageRepository.findByRoomId(eq(testRoomId), any(Pageable.class))).thenReturn(messagePage);
        when(roomRepository.findById(testRoomId)).thenReturn(Optional.of(testRoom));

        // When
        List<ChatMessageResp> result = chatMessageService.getChatMessages(testRoomId, page, size);

        // Then
        assertEquals(1, result.size());
        ChatMessageResp resp = result.get(0);
        assertEquals(testMessage.getId(), resp.getId());
        assertEquals(testSessionId, resp.getSessionId());
        assertEquals(testSenderNickname, resp.getSenderNickname());
        assertEquals(testContent, resp.getContent());
        assertEquals("text", resp.getMessageType());
        assertEquals(testRoom.getCode(), resp.getRoomCode());
        assertNotNull(resp.getCreatedAt());

        verify(chatMessageRepository, times(1)).findByRoomId(eq(testRoomId), any(Pageable.class));
        verify(roomRepository, times(1)).findById(testRoomId);
    }

    @Test
    void getChatMessages_shouldThrowExceptionWhenPageIsNegative() {
        // Given
        int page = -1;
        int size = 10;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> chatMessageService.getChatMessages(testRoomId, page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());

        verify(chatMessageRepository, never()).findByRoomId(anyLong(), any(Pageable.class));
    }

    @Test
    void getChatMessages_shouldThrowExceptionWhenSizeIsZero() {
        // Given
        int page = 0;
        int size = 0;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> chatMessageService.getChatMessages(testRoomId, page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());

        verify(chatMessageRepository, never()).findByRoomId(anyLong(), any(Pageable.class));
    }

    @Test
    void getChatMessages_shouldThrowExceptionWhenSizeIsGreaterThan100() {
        // Given
        int page = 0;
        int size = 101;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> chatMessageService.getChatMessages(testRoomId, page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());

        verify(chatMessageRepository, never()).findByRoomId(anyLong(), any(Pageable.class));
    }

    @Test
    void getChatMessages_shouldHandleEmptyRoomReference() {
        // Given
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ChatMessage> messagePage = new PageImpl<>(Arrays.asList(testMessage), pageable, 1);

        when(chatMessageRepository.findByRoomId(eq(testRoomId), any(Pageable.class))).thenReturn(messagePage);
        when(roomRepository.findById(testRoomId)).thenReturn(Optional.empty());

        // When
        List<ChatMessageResp> result = chatMessageService.getChatMessages(testRoomId, page, size);

        // Then
        assertEquals(1, result.size());
        ChatMessageResp resp = result.get(0);
        assertNull(resp.getRoomCode()); // Room code should be null when room not found
    }

    @Test
    void saveMessage_shouldSaveMessageWithTextType() {
        // Given
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(100L);
            message.setCreatedAt(LocalDateTime.now());
            return message;
        });

        // When
        ChatMessage result = chatMessageService.saveMessage(testRoomId, testSessionId, testSenderNickname, testContent, null);

        // Then
        assertNotNull(result);
        assertEquals(testRoomId, result.getRoomId());
        assertEquals(testSessionId, result.getSessionId());
        assertEquals(testSenderNickname, result.getSenderNickname());
        assertEquals(testContent, result.getContent());
        assertEquals("text", result.getMessageType()); // Default message type
        assertNotNull(result.getCreatedAt());

        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    void saveMessage_shouldSaveMessageWithCustomType() {
        // Given
        String messageType = "system";
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(100L);
            message.setCreatedAt(LocalDateTime.now());
            return message;
        });

        // When
        ChatMessage result = chatMessageService.saveMessage(testRoomId, testSessionId, testSenderNickname, testContent, messageType);

        // Then
        assertNotNull(result);
        assertEquals(messageType, result.getMessageType());
    }

    @Test
    void saveMessage_shouldHandleNullContent() {
        // Given
        String nullContent = null;
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(100L);
            message.setCreatedAt(LocalDateTime.now());
            return message;
        });

        // When
        ChatMessage result = chatMessageService.saveMessage(testRoomId, testSessionId, testSenderNickname, nullContent, "text");

        // Then
        assertNotNull(result);
        assertNull(result.getContent());
    }
}