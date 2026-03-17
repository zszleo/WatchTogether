package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.req.AddUserEmojiReq;
import com.watchtogether.model.Emoji;
import com.watchtogether.service.EmojiService;
import com.watchtogether.service.SessionService;
import com.watchtogether.annotation.SessionId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/emojis")
@Tag(name = "表情系统", description = "表情管理和反应相关的API")
public class EmojiController {

    private final EmojiService emojiService;
    @Autowired
    public EmojiController(EmojiService emojiService) {
        this.emojiService = emojiService;
    }

    @GetMapping("/default")
    @Operation(
        summary = "获取默认表情",
        description = "获取系统默认提供的表情列表"
    )
    public ResponseEntity<ApiResp<List<Emoji>>> getDefaultEmojis() {
        List<Emoji> emojis = emojiService.getDefaultEmojis();
        return ResponseEntity.ok(ApiResp.success(emojis));
    }

    @GetMapping("/user")
    @Operation(
        summary = "获取用户表情",
        description = "获取用户自定义的表情列表，需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<List<Emoji>>> getUserEmojis(
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId) {
        
        List<Emoji> emojis = emojiService.getUserEmojis(sessionId);
        return ResponseEntity.ok(ApiResp.success(emojis));
    }
    
    @PostMapping("/user")
    @Operation(
        summary = "添加用户表情",
        description = "添加用户自定义表情，需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<Emoji>> addUserEmoji(
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId,
            @Valid @RequestBody 
            @Schema(description = "添加表情请求参数") 
            AddUserEmojiReq request) {
        
        String name = request.getName();
        String type = request.getType();
        String url = request.getUrl();
        
        if (name == null || type == null) {
            return new ResponseEntity<>(ApiResp.badRequest("Name and type are required"), HttpStatus.BAD_REQUEST);
        }
        
        Emoji emoji = emojiService.addUserEmoji(sessionId, name, type, url);
        return new ResponseEntity<>(ApiResp.created(emoji), HttpStatus.CREATED);
    }

    @DeleteMapping("/user/{emojiId}")
    @Operation(
        summary = "删除用户表情",
        description = "删除用户自定义表情，需要有效的会话ID"
    )
    public ResponseEntity<ApiResp<Void>> deleteUserEmoji(
            @PathVariable 
            @Parameter(description = "表情ID", example = "789") 
            Long emojiId,
            @SessionId
            @Parameter(description = "用户会话ID", example = "sess_abc123def456") 
            String sessionId) {
        
        boolean deleted = emojiService.deleteUserEmoji(emojiId, sessionId);
        if (!deleted) {
            return new ResponseEntity<>(ApiResp.notFound("Emoji not found or access denied"), HttpStatus.NOT_FOUND);
        }
        
        return ResponseEntity.ok(ApiResp.success("Emoji deleted successfully", null));
    }
}
