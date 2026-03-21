package com.watchtogether.service;

import com.watchtogether.dto.resp.ChatMessageResp;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    @Captor
    private ArgumentCaptor<ChatMessage> messageCaptor;

    @Captor
    private ArgumentCaptor<Pageable> pageableCaptor;

    private ChatMessage mockMessage;

    @BeforeEach
    void setUp() {
        mockMessage = new ChatMessage();
        mockMessage.setId(1L);
        mockMessage.setRoomId(100L);
        mockMessage.setSessionId("session-123");
        mockMessage.setContent("Hello World");
        mockMessage.setMessageType("text");
        mockMessage.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void getChatMessages_WithValidParameters_ShouldReturnMessages() {
        List<ChatMessage> messages = Arrays.asList(mockMessage);
        Page<ChatMessage> page = new PageImpl<>(messages);
        when(chatMessageRepository.findByRoomId(eq(100L), any(Pageable.class))).thenReturn(page);

        List<ChatMessageResp> result = chatMessageService.getChatMessages(100L, 0, 50);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Hello World", result.get(0).getContent());
        assertEquals("session-123", result.get(0).getSessionId());
        
        verify(chatMessageRepository).findByRoomId(eq(100L), pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(50, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void getChatMessages_WithInvalidPage_ShouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> 
            chatMessageService.getChatMessages(100L, -1, 50));
    }

    @Test
    void getChatMessages_WithInvalidSize_ShouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> 
            chatMessageService.getChatMessages(100L, 0, 0));
        assertThrows(IllegalArgumentException.class, () -> 
            chatMessageService.getChatMessages(100L, 0, 101));
    }

    @Test
    void getChatMessages_WithEmptyResult_ShouldReturnEmptyList() {
        Page<ChatMessage> emptyPage = new PageImpl<>(List.of());
        when(chatMessageRepository.findByRoomId(eq(100L), any(Pageable.class))).thenReturn(emptyPage);

        List<ChatMessageResp> result = chatMessageService.getChatMessages(100L, 0, 50);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void saveMessage_WithValidData_ShouldSaveAndReturnMessage() {
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(1L);
            msg.setCreatedAt(LocalDateTime.now());
            return msg;
        });

        ChatMessage result = chatMessageService.saveMessage(100L, "session-123","test_user", "Hello", "text");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(100L, result.getRoomId());
        assertEquals("session-123", result.getSessionId());
        assertEquals("Hello", result.getContent());
        assertEquals("text", result.getMessageType());

        verify(chatMessageRepository).save(messageCaptor.capture());
        ChatMessage saved = messageCaptor.getValue();
        assertEquals(100L, saved.getRoomId());
        assertEquals("Hello", saved.getContent());
    }

    @Test
    void saveMessage_WithNullMessageType_ShouldUseDefaultType() {
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage msg = invocation.getArgument(0);
            msg.setId(1L);
            return msg;
        });

        chatMessageService.saveMessage(100L, "session-123","test_user", "Hello", null);

        verify(chatMessageRepository).save(messageCaptor.capture());
        assertEquals("text", messageCaptor.getValue().getMessageType());
    }
}
