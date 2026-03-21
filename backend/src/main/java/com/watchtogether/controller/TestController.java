package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.repository.ChatMessageRepository;
import com.watchtogether.repository.RoomRepository;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.repository.SessionHistoryRepository;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;

@RestController
@RequestMapping("/api/test")
@ConditionalOnProperty(name = "app.features.debug-endpoints", havingValue = "true")
@Slf4j
@Tag(name = "测试工具", description = "集成测试专用工具API，仅在debug-endpoints启用时可用")
public class TestController {

    @Resource
    private SessionRepository sessionRepository;

    @Resource
    private RoomRepository roomRepository;

    @Resource
    private ChatMessageRepository chatMessageRepository;

    @Resource
    private SessionHistoryRepository sessionHistoryRepository;

    @Resource
    private SessionService sessionService;

    @Resource
    private RoomService roomService;

    @PostMapping("/clear-users")
    @Operation(summary = "清理测试用户", description = "清理所有测试用户数据，包括会话和会话历史")
    public ResponseEntity<ApiResp<String>> clearUsers() {
        log.info("Cleaning up test users");
        try {
            sessionHistoryRepository.deleteAll();
            sessionRepository.deleteAll();
            return ResponseEntity.ok(ApiResp.success("测试用户数据已清理"));
        } catch (Exception e) {
            log.error("Failed to clear test users", e);
            return ResponseEntity.ok(ApiResp.success("清理测试用户时发生错误: " + e.getMessage()));
        }
    }

    @PostMapping("/clear-rooms")
    @Operation(summary = "清理测试房间", description = "清理所有测试房间数据，包括房间信息和聊天消息")
    public ResponseEntity<ApiResp<String>> clearRooms() {
        log.info("Cleaning up test rooms");
        try {
            chatMessageRepository.deleteAll();
            roomRepository.deleteAll();
            return ResponseEntity.ok(ApiResp.success("测试房间数据已清理"));
        } catch (Exception e) {
            log.error("Failed to clear test rooms", e);
            return ResponseEntity.ok(ApiResp.success("清理测试房间时发生错误: " + e.getMessage()));
        }
    }

    @PostMapping("/clear-messages")
    @Operation(summary = "清理测试消息", description = "清理所有测试聊天消息数据")
    public ResponseEntity<ApiResp<String>> clearMessages() {
        log.info("Cleaning up test messages");
        try {
            chatMessageRepository.deleteAll();
            return ResponseEntity.ok(ApiResp.success("测试消息数据已清理"));
        } catch (Exception e) {
            log.error("Failed to clear test messages", e);
            return ResponseEntity.ok(ApiResp.success("清理测试消息时发生错误: " + e.getMessage()));
        }
    }

    @PostMapping("/clear-all")
    @Operation(summary = "清理所有测试数据", description = "清理所有测试数据，包括用户、房间、消息等")
    public ResponseEntity<ApiResp<String>> clearAll() {
        log.info("Cleaning up all test data");
        try {
            // 清理顺序：消息 -> 会话历史 -> 房间 -> 会话 -> 表情
            chatMessageRepository.deleteAll();
            sessionHistoryRepository.deleteAll();
            roomRepository.deleteAll();
            sessionRepository.deleteAll();
            return ResponseEntity.ok(ApiResp.success("所有测试数据已清理"));
        } catch (Exception e) {
            log.error("Failed to clear all test data", e);
            return ResponseEntity.ok(ApiResp.success("清理所有测试数据时发生错误: " + e.getMessage()));
        }
    }

    @PostMapping("/create-test-data")
    @Operation(summary = "创建测试数据", description = "创建基础的测试数据用于集成测试")
    public ResponseEntity<ApiResp<String>> createTestData() {
        log.info("Creating test data");
        try {
            // 这里可以添加创建测试数据的逻辑
            // 例如创建测试用户、房间等
            return ResponseEntity.ok(ApiResp.success("测试数据创建完成"));
        } catch (Exception e) {
            log.error("Failed to create test data", e);
            return ResponseEntity.ok(ApiResp.success("创建测试数据时发生错误: " + e.getMessage()));
        }
    }
}