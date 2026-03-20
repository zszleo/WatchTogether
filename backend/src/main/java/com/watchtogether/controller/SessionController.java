package com.watchtogether.controller;

import com.watchtogether.dto.req.CreateSessionReq;
import com.watchtogether.dto.req.UpdateProfileReq;
import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.SessionHistoryResp;
import com.watchtogether.dto.resp.SessionResp;
import com.watchtogether.model.Session;
import com.watchtogether.model.SessionHistory;
import com.watchtogether.service.SessionService;
import com.watchtogether.service.SessionHistoryService;
import com.watchtogether.service.RoomService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/session")
@Slf4j
@Tag(name = "会话管理", description = "用户会话管理相关的API")
public class SessionController {

    @Resource
    private SessionService sessionService;
    @Resource
    private SessionHistoryService historyService;
    @Resource
    private RoomService roomService;

    @PostMapping
    @Operation(
        summary = "创建会话",
        description = "创建一个新的用户会话，返回会话ID和用户信息"
    )
    public ResponseEntity<ApiResp<SessionResp>> createSession(
            @Valid @RequestBody 
            @Schema(description = "创建会话的请求参数") 
            CreateSessionReq request) {
        log.info("createSession called with nickname: {}, avatar: {}", request.getNickname(), request.getAvatar());
        Session session = sessionService.createSession(request.getNickname(), request.getAvatar());
        
        SessionResp response = new SessionResp(
            session.getId(),
            session.getNickname(),
            session.getAvatar(),
            session.getIsOnline(),
            getRoomCode(session.getRoomId()),
            session.getCreatedAt(),
            session.getLastSeenAt()
        );
        
        return new ResponseEntity<>(ApiResp.created(response), HttpStatus.CREATED);
    }

    @GetMapping("/{sessionId}")
    @Operation(
        summary = "获取会话信息",
        description = "根据会话ID获取用户的会话详细信息"
    )
    public ResponseEntity<ApiResp<SessionResp>> getSession(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId) {
        log.info("getSession called with sessionId: {}", sessionId);
        Optional<Session> sessionOpt = sessionService.getSession(sessionId);
        
        if (!sessionOpt.isPresent()) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        Session session = sessionOpt.get();
        SessionResp response = new SessionResp(
            session.getId(),
            session.getNickname(),
            session.getAvatar(),
            session.getIsOnline(),
            getRoomCode(session.getRoomId()),
            session.getCreatedAt(),
            session.getLastSeenAt()
        );
        
        return ResponseEntity.ok(ApiResp.success(response));
    }
    
    @DeleteMapping("/{sessionId}")
    @Operation(
        summary = "删除会话",
        description = "删除指定会话ID的用户会话"
    )
    public ResponseEntity<ApiResp<Void>> deleteSession(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId) {
        log.info("deleteSession called with sessionId: {}", sessionId);
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResp.success("Session deleted successfully", null));
    }

    @GetMapping("/{sessionId}/validate")
    @Operation(
        summary = "验证会话",
        description = "验证会话ID是否有效"
    )
    public ResponseEntity<ApiResp<Boolean>> validateSession(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId) {
        log.info("validateSession called with sessionId: {}", sessionId);
        boolean isValid = sessionService.validateSession(sessionId);
        return ResponseEntity.ok(ApiResp.success(isValid));
    }

    @PutMapping("/{sessionId}/profile")
    @Operation(
        summary = "更新用户资料",
        description = "更新用户的昵称和头像"
    )
    public ResponseEntity<ApiResp<SessionResp>> updateProfile(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @Valid @RequestBody 
            @Schema(description = "更新资料请求参数") 
            UpdateProfileReq request) {
        log.info("updateProfile called with sessionId: {}, nickname: {}, avatar: {}", sessionId, request.getNickname(), request.getAvatar());
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        String nickname = request.getNickname();
        String avatar = request.getAvatar();
        
        Optional<Session> updatedOpt = sessionService.updateSession(sessionId, nickname, avatar);
        
        if (updatedOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        Session session = updatedOpt.get();
        SessionResp response = new SessionResp(
            session.getId(),
            session.getNickname(),
            session.getAvatar(),
            session.getIsOnline(),
            getRoomCode(session.getRoomId()),
            session.getCreatedAt(),
            session.getLastSeenAt()
        );
        
        return ResponseEntity.ok(ApiResp.success(response));
    }
    
    private SessionHistoryResp convertToResp(SessionHistory history) {
        SessionHistoryResp resp = new SessionHistoryResp();
        resp.setId(history.getId());
        resp.setSessionId(history.getSessionId());
        resp.setRoomCode(history.getRoomCode());
        resp.setRoomName(history.getRoomName());
        resp.setVideoTitle(history.getVideoTitle());
        resp.setJoinedAt(history.getJoinedAt());
        resp.setLeftAt(history.getLeftAt());
        return resp;
    }
    
    @GetMapping("/{sessionId}/history")
    @Operation(
        summary = "获取用户历史记录",
        description = "获取用户的房间加入历史记录"
    )
    public ResponseEntity<ApiResp<List<SessionHistoryResp>>> getHistory(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @RequestParam(defaultValue = "50") 
            @Parameter(description = "返回记录数量限制", example = "50") 
            int limit) {
        log.info("getHistory called with sessionId: {}, limit: {}", sessionId, limit);
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        List<SessionHistoryResp> respList = historyService.getUserHistoryWithLimit(sessionId, limit)
                .stream()
                .map(this::convertToResp)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResp.success(respList));
    }

    @PostMapping("/{sessionId}/history/join/{roomCode}")
    @Operation(
        summary = "加入房间历史记录",
        description = "记录用户加入房间的历史"
    )
    public ResponseEntity<ApiResp<SessionHistoryResp>> joinRoom(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @PathVariable 
            @Parameter(description = "房间码", example = "ABC123") 
            String roomCode) {
        log.info("joinRoom called with sessionId: {}, roomCode: {}", sessionId, roomCode);
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        var roomOpt = roomService.getRoomByCode(roomCode);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        var room = roomOpt.get();
        
        SessionHistory history = historyService.joinRoom(
            sessionId, 
            room.getId(),
            room.getCode(),
            room.getName(), 
            room.getVideoTitle()
        );
        SessionHistoryResp resp = convertToResp(history);
        return new ResponseEntity<>(ApiResp.created(resp), HttpStatus.CREATED);
    }

    @PostMapping("/{sessionId}/history/{historyId}/leave")
    @Operation(
        summary = "离开房间历史记录",
        description = "记录用户离开房间的历史"
    )
    public ResponseEntity<ApiResp<Void>> leaveRoom(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @PathVariable 
            @Parameter(description = "历史记录ID", example = "456") 
            Long historyId) {
        log.info("leaveRoom called with sessionId: {}, historyId: {}", sessionId, historyId);
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        historyService.leaveRoom(historyId);
        return ResponseEntity.ok(ApiResp.success("Left room successfully", null));
    }
    
    private String getRoomCode(Long roomId) {
        if (roomId == null) {
            return null;
        }
        return roomService.getRoomById(roomId)
            .map(room -> room.getCode())
            .orElse(null);
    }
}