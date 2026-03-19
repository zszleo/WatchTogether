package com.watchtogether.controller;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.req.AddUserEmojiReq;
import com.watchtogether.model.Emoji;
import com.watchtogether.service.EmojiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import java.util.List;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/emoji")
@Slf4j
@Tag(name = "表情系统", description = "表情管理和反应相关的API")
public class EmojiController {

    @Resource
    private EmojiService emojiService;

    @GetMapping("/default")
    @Operation(
        summary = "获取默认表情",
        description = "获取系统默认提供的表情列表"
    )
    public ResponseEntity<ApiResp<List<Emoji>>> getDefaultEmojis() {
        log.info("getDefaultEmojis called");
        List<Emoji> emojis = emojiService.getDefaultEmojis();
        return ResponseEntity.ok(ApiResp.success(emojis));
    }

    @GetMapping("/user/{nickname}")
    @Operation(
        summary = "根据昵称获取表情",
        description = "根据用户昵称获取自定义的表情列表"
    )
    public ResponseEntity<ApiResp<List<Emoji>>> getEmojisByNickname(
            @PathVariable 
            @Parameter(description = "用户昵称", example = "testuser") 
            String nickname) {
        log.info("getEmojisByNickname called with nickname: {}", nickname);
        
        List<Emoji> emojis = emojiService.getEmojisByNickname(nickname);
        return ResponseEntity.ok(ApiResp.success(emojis));
    }

    @PostMapping("/user/{nickname}")
    @Operation(
        summary = "根据昵称添加表情",
        description = "根据用户昵称添加自定义表情"
    )
    public ResponseEntity<ApiResp<Emoji>> addEmojiByNickname(
            @PathVariable 
            @Parameter(description = "用户昵称", example = "testuser") 
            String nickname,
            @Valid @RequestBody 
            @Schema(description = "添加表情请求参数") 
            AddUserEmojiReq request) {
        log.info("addEmojiByNickname called with nickname: {}, name: {}, type: {}, url: {}", 
                nickname, request.getName(), request.getType(), request.getUrl());
         
        String name = request.getName();
        String type = request.getType();
        String url = request.getUrl();
         
        if (name == null || type == null) {
            return new ResponseEntity<>(ApiResp.badRequest("Name and type are required"), HttpStatus.BAD_REQUEST);
        }
         
        Emoji emoji = emojiService.addEmojiByNickname(nickname, name, type, url);
        return new ResponseEntity<>(ApiResp.created(emoji), HttpStatus.CREATED);
    }

    @DeleteMapping("/user/{nickname}/{emojiId}")
    @Operation(
        summary = "根据昵称删除表情",
        description = "根据用户昵称删除自定义表情"
    )
    public ResponseEntity<ApiResp<Void>> deleteEmojiByNickname(
            @PathVariable 
            @Parameter(description = "用户昵称", example = "testuser") 
            String nickname,
            @PathVariable 
            @Parameter(description = "表情ID", example = "789") 
            Long emojiId) {
        log.info("deleteEmojiByNickname called with nickname: {}, emojiId: {}", nickname, emojiId);
         
        boolean deleted = emojiService.deleteEmojiByNickname(emojiId, nickname);
        if (!deleted) {
            return new ResponseEntity<>(ApiResp.notFound("Emoji not found or access denied"), HttpStatus.NOT_FOUND);
        }
         
        return ResponseEntity.ok(ApiResp.success("Emoji deleted successfully", null));
    }
}
