package com.watchtogether.controller;

import com.watchtogether.dto.req.CreateSessionReq;
import com.watchtogether.dto.req.UpdateProfileReq;
import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.SessionResp;
import com.watchtogether.model.Session;
import com.watchtogether.model.SessionHistory;
import com.watchtogether.service.SessionService;
import com.watchtogether.service.SessionHistoryService;
import com.watchtogether.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "会话管理", description = "用户会话管理相关的API")
public class SessionController {

    private final SessionService sessionService;
    private final SessionHistoryService historyService;
    private final RoomService roomService;

    @Autowired
    public SessionController(SessionService sessionService, SessionHistoryService historyService, RoomService roomService) {
        this.sessionService = sessionService;
        this.historyService = historyService;
        this.roomService = roomService;
    }

    @PostMapping
    @Operation(
        summary = "创建会话",
        description = "创建一个新的用户会话，返回会话ID和用户信息"
    )
    public ResponseEntity<ApiResp<SessionResp>> createSession(
            @Valid @RequestBody 
            @Schema(description = "创建会话的请求参数") 
            CreateSessionReq request) {
        Session session = sessionService.createSession(request.getNickname(), request.getAvatar());
        
        SessionResp response = new SessionResp(
            session.getId(),
            session.getNickname(),
            session.getAvatar(),
            session.getIsOnline(),
            session.getRoomId(),
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
            session.getRoomId(),
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
            session.getRoomId(),
            session.getCreatedAt(),
            session.getLastSeenAt()
        );
        
        return ResponseEntity.ok(ApiResp.success(response));
    }

    @GetMapping("/{sessionId}/history")
    @Operation(
        summary = "获取用户历史记录",
        description = "获取用户的房间加入历史记录"
    )
    public ResponseEntity<ApiResp<List<SessionHistory>>> getHistory(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @RequestParam(defaultValue = "50") 
            @Parameter(description = "返回记录数量限制", example = "50") 
            int limit) {
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        List<SessionHistory> history = historyService.getUserHistoryWithLimit(sessionId, limit);
        return ResponseEntity.ok(ApiResp.success(history));
    }

    @PostMapping("/{sessionId}/history/join/{roomId}")
    @Operation(
        summary = "加入房间历史记录",
        description = "记录用户加入房间的历史"
    )
    public ResponseEntity<ApiResp<SessionHistory>> joinRoom(
            @PathVariable 
            @Parameter(description = "会话ID", example = "sess_abc123def456") 
            String sessionId,
            @PathVariable 
            @Parameter(description = "房间ID", example = "123") 
            Long roomId) {
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        var roomOpt = roomService.getRoomById(roomId);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        var room = roomOpt.get();
        SessionHistory history = historyService.joinRoom(
            sessionId, 
            roomId, 
            room.getName(), 
            room.getVideoTitle()
        );
        
        return new ResponseEntity<>(ApiResp.created(history), HttpStatus.CREATED);
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
        
        if (!sessionService.validateSession(sessionId)) {
            return new ResponseEntity<>(ApiResp.notFound("Session not found"), HttpStatus.NOT_FOUND);
        }
        
        historyService.leaveRoom(historyId);
        return ResponseEntity.ok(ApiResp.success("Left room successfully", null));
    }
}