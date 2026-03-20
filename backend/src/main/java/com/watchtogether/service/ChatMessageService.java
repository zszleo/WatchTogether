package com.watchtogether.service;

import com.watchtogether.dto.resp.ChatMessageResp;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.model.Room;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.repository.RoomRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatMessageService {

    @Resource
    private ChatMessageRepository chatMessageRepository;
    
    @Resource
    private RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageResp> getChatMessages(Long roomId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Invalid pagination parameters");
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ChatMessage> messages = chatMessageRepository.findByRoomId(roomId, pageable);
        
        return messages.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessage saveMessage(Long roomId, String sessionId, String content, String messageType) {
        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);
        message.setSessionId(sessionId);
        message.setContent(content);
        message.setMessageType(messageType != null ? messageType : "text");
        return chatMessageRepository.save(message);
    }

    private ChatMessageResp mapToResponse(ChatMessage message) {
        ChatMessageResp resp = new ChatMessageResp();
        resp.setId(message.getId());
        resp.setSessionId(message.getSessionId());
        resp.setContent(message.getContent());
        resp.setMessageType(message.getMessageType());
        resp.setCreatedAt(message.getCreatedAt());
        
        // Get room code from roomId
        roomRepository.findById(message.getRoomId()).ifPresent(room -> {
            resp.setRoomCode(room.getCode());
        });
        
        return resp;
    }
}
