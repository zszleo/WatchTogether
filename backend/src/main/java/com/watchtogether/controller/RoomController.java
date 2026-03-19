package com.watchtogether.controller;

import com.watchtogether.annotation.SessionId;
import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.RoomResp;
import com.watchtogether.model.Room;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/room")
@Tag(name = "房间管理", description = "创建、加入和管理观看房间相关的API")
@Slf4j
public class RoomController {

    @Resource
    private RoomService roomService;
    @Resource
    private SessionService sessionService;

    @PostMapping
    @Operation(
        summary = "创建房间",
        description = "创建一个新的观看房间，需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<RoomResp>> createRoom(
            @Valid @RequestBody 
            @Schema(description = "创建房间的请求参数") 
            CreateRoomReq request,
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId) {
        log.info("createRoom called with sessionId: {}, request: {}", sessionId, request);
        
        Room room = roomService.createRoom(request, sessionId);
        RoomResp response = mapToRoomResponse(room);
        
        return new ResponseEntity<>(ApiResp.created(response), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(
        summary = "获取公开房间列表",
        description = "获取所有公开可见的房间列表"
    )
    public ResponseEntity<ApiResp<List<RoomResp>>> getPublicRooms() {
        log.info("getPublicRooms called");
        List<RoomResp> rooms = roomService.getPublicRooms();
        return ResponseEntity.ok(ApiResp.success(rooms));
    }

    @GetMapping("/{roomId}")
    @Operation(
        summary = "获取房间详情",
        description = "根据房间ID获取房间详细信息，私有房间需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<RoomResp>> getRoom(
            @PathVariable 
            @Parameter(description = "房间ID", example = "123") 
            Long roomId,
            @SessionId(required = false)
            @Parameter(description = "用户会话ID（访问私有房间时必需）", example = "sess_abc123def456") 
            String sessionId) {
        log.info("getRoom called with roomId: {}, sessionId: {}", roomId, sessionId);
        
        Optional<Room> roomOpt = roomService.getRoomById(roomId);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        Room room = roomOpt.get();
        // Check if room is private and user has access
        if (!room.getIsPublic() && sessionId == null) {
            return new ResponseEntity<>(ApiResp.unauthorized("Access denied to private room"), HttpStatus.UNAUTHORIZED);
        }
        
        RoomResp response = mapToRoomResponse(room);
        return ResponseEntity.ok(ApiResp.success(response));
    }

    @GetMapping("/code/{roomCode}")
    @Operation(
        summary = "通过房间码获取房间详情",
        description = "根据房间邀请码获取房间详细信息，私有房间需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<RoomResp>> getRoomByCode(
            @PathVariable 
            @Parameter(description = "房间邀请码", example = "ABC123") 
            String roomCode,
            @SessionId(required = false)
            @Parameter(description = "用户会话ID（访问私有房间时必需）", example = "sess_abc123def456") 
            String sessionId) {
        
        Optional<Room> roomOpt = roomService.getRoomByCode(roomCode);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        Room room = roomOpt.get();
        // Check if room is private and user has access
        if (!room.getIsPublic() && sessionId == null) {
            return new ResponseEntity<>(ApiResp.unauthorized("Access denied to private room"), HttpStatus.UNAUTHORIZED);
        }
        
        RoomResp response = mapToRoomResponse(room);
        return ResponseEntity.ok(ApiResp.success(response));
    }

    @DeleteMapping("/{roomId}")
    @Operation(
        summary = "删除房间",
        description = "删除指定房间，需要房间所有者权限"
    )
    public ResponseEntity<ApiResp<Void>> deleteRoom(
            @PathVariable 
            @Parameter(description = "房间ID", example = "123") 
            Long roomId,
            @SessionId
            @Parameter(description = "用户会话ID（必须为房间所有者）", example = "sess_abc123def456") 
            String sessionId) {
        

        
        boolean deleted = roomService.deleteRoom(roomId, sessionId);
        if (!deleted) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found or access denied"), HttpStatus.NOT_FOUND);
        }
        
        return ResponseEntity.ok(ApiResp.success("Room deleted successfully", null));
    }

    @GetMapping("/{roomId}/invite")
    @Operation(
        summary = "获取房间邀请链接",
        description = "获取房间的邀请链接，私有房间需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<String>> getInviteLink(
            @PathVariable 
            @Parameter(description = "房间ID", example = "123") 
            Long roomId,
            @SessionId(required = false)
            @Parameter(description = "用户会话ID（访问私有房间时必需）", example = "sess_abc123def456") 
            String sessionId) {
        
        Optional<Room> roomOpt = roomService.getRoomById(roomId);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        Room room = roomOpt.get();
        // Only room owner or anyone with access can get invite link
        if (!room.getIsPublic() && sessionId == null) {
            return new ResponseEntity<>(ApiResp.unauthorized("Access denied"), HttpStatus.UNAUTHORIZED);
        }
        
        String inviteLink = roomService.generateInviteLink(room.getCode());
        return ResponseEntity.ok(ApiResp.success(inviteLink));
    }

    @GetMapping("/{roomId}/messages")
    @Operation(
        summary = "获取聊天消息",
        description = "获取房间的聊天消息历史，支持分页"
    )
    public ResponseEntity<ApiResp<?>> getChatMessages(
            @PathVariable 
            @Parameter(description = "房间ID", example = "123") 
            Long roomId,
            @RequestParam(defaultValue = "0") 
            @Parameter(description = "页码（从0开始）", example = "0") 
            int page,
            @RequestParam(defaultValue = "50") 
            @Parameter(description = "每页大小", example = "50") 
            int size,
            @SessionId(required = false)
            @Parameter(description = "用户会话ID（访问私有房间时必需）", example = "sess_abc123def456") 
            String sessionId) {
        
        Optional<Room> roomOpt = roomService.getRoomById(roomId);
        if (roomOpt.isEmpty()) {
            return new ResponseEntity<>(ApiResp.notFound("Room not found"), HttpStatus.NOT_FOUND);
        }
        
        Room room = roomOpt.get();
        // Check access
        if (!room.getIsPublic() && sessionId == null) {
            return new ResponseEntity<>(ApiResp.unauthorized("Access denied"), HttpStatus.UNAUTHORIZED);
        }
        
        // TODO: Implement chat message retrieval
        return ResponseEntity.ok(ApiResp.success("Chat messages endpoint - to be implemented"));
    }

    private RoomResp mapToRoomResponse(Room room) {
        RoomResp response = new RoomResp();
        response.setId(room.getId());
        response.setCode(room.getCode());
        response.setName(room.getName());
        response.setDescription(room.getDescription());
        response.setMaxUsers(room.getMaxUsers());
        response.setIsPublic(room.getIsPublic());
        response.setOwnerSessionId(room.getOwnerSessionId());
        response.setVideoUrl(room.getVideoUrl());
        response.setVideoTitle(room.getVideoTitle());
        response.setVideoDuration(room.getVideoDuration());
        response.setCurrentPlaybackTime(room.getCurrentPlaybackTime());
        response.setIsPlaying(room.getIsPlaying());
        response.setLastActivityAt(room.getLastActivityAt());
        response.setCreatedAt(room.getCreatedAt());
        response.setUpdatedAt(room.getUpdatedAt());
        response.setInviteLink(roomService.generateInviteLink(room.getCode()));
        
        return response;
    }
}