package com.watchtogether.service;

import lombok.extern.slf4j.Slf4j;
import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.dto.resp.RoomResp;
import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import com.watchtogether.utils.RedisUtil;

import jakarta.annotation.Resource;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RoomService {

    @Resource
    public RedisUtil redisUtil;
    @Resource
    public RoomRepository roomRepository;

    public Room createRoom(CreateRoomReq request, String ownerSessionId) {
        String roomCode = generateRoomCode();
        
        Room room = new Room();
        room.setCode(roomCode);
        room.setName(request.getName());
        room.setDescription(request.getDescription());
        room.setMaxUsers(request.getMaxUsers() != null ? request.getMaxUsers() : 5);
        room.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : true);
        room.setOwnerSessionId(ownerSessionId);
        room.setVideoUrl(request.getVideoUrl());
        room.setVideoTitle(request.getVideoTitle());
        // createdAt, updatedAt, lastActivityAt will be set by @PrePersist
        
        roomRepository.save(room);
        
        // Cache room in Redis
        cacheRoom(room);
        
        log.info("Created new room: {} (code: {}) owned by session {}", 
                   room.getId(), roomCode, ownerSessionId);
        return room;
    }

    public Optional<Room> getRoomById(Long roomId) {
        // Try Redis first
        Map<String, Object> cached = redisUtil.getRoom(roomId.toString(), Map.class);
        if (cached != null) {
            Room room = mapToRoom(cached);
            return Optional.of(room);
        }
        
        // Fallback to database
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isPresent()) {
            // Cache it for future use
            cacheRoom(roomOpt.get());
        }
        
        return roomOpt;
    }

    public Optional<Room> getRoomByCode(String roomCode) {
        // Try Redis first by finding room ID from code
        // Note: We need to map code to ID, for simplicity query DB
        // Could optimize with additional Redis mapping
        return roomRepository.findByCode(roomCode);
    }

    public List<RoomResp> getPublicRooms() {
        List<Room> rooms = roomRepository.findByIsPublicTrueOrderByLastActivityAtDesc();
        
        return rooms.stream().map(room -> {
            RoomResp response = mapToRoomResponse(room);
            // Add online user count from Redis
            Integer onlineCount = getOnlineUserCount(room.getId());
            response.setOnlineUserCount(onlineCount);
            response.setInviteLink(generateInviteLink(room.getCode()));
            return response;
        }).collect(Collectors.toList());
    }

    public boolean deleteRoom(Long roomId, String sessionId) {
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return false;
        }
        
        Room room = roomOpt.get();
        // Check ownership
        if (!sessionId.equals(room.getOwnerSessionId())) {
            log.warn("Session {} attempted to delete room {} owned by {}", 
                       sessionId, roomId, room.getOwnerSessionId());
            return false;
        }
        
        roomRepository.delete(room);
        
        // Clean up Redis cache
        redisUtil.deleteRoom(roomId.toString());
        redisUtil.delete(RedisUtil.KEY_PREFIX_ROOM_USERS + roomId);
        redisUtil.delete(RedisUtil.KEY_PREFIX_ROOM_PLAYBACK + roomId);
        
        log.info("Deleted room: {} (code: {})", roomId, room.getCode());
        return true;
    }

    public String generateInviteLink(String roomCode) {
        // In a real app, this would be a full URL
        // For now, return the room code as part of a path
        return "/join/" + roomCode;
    }

    public void updateRoomActivity(Long roomId) {
        roomRepository.updateLastActivity(roomId, LocalDateTime.now());
        
        // Also update Redis TTL for room cache
        Map<String, Object> cached = redisUtil.getRoom(roomId.toString(), Map.class);
        if (cached != null) {
            redisUtil.setRoom(roomId.toString(), cached);
        }
    }

    public void updateVideoInfo(Long roomId, String videoUrl, String videoTitle, Integer videoDuration) {
        roomRepository.updateVideoInfo(roomId, videoUrl, videoTitle, videoDuration);
        
        // Update Redis cache
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isPresent()) {
            cacheRoom(roomOpt.get());
        }
    }

    public void updatePlaybackState(Long roomId, Double currentTime, Boolean isPlaying) {
        LocalDateTime now = LocalDateTime.now();
        roomRepository.updatePlaybackState(roomId, currentTime, isPlaying, now);
        
        // Update Redis playback cache
        Map<String, Object> playbackState = new HashMap<>();
        playbackState.put("currentTime", currentTime);
        playbackState.put("isPlaying", isPlaying);
        playbackState.put("updatedAt", now.toString());
        redisUtil.setRoomPlayback(roomId.toString(), playbackState);
    }

    public Integer getOnlineUserCount(Long roomId) {
        // In Redis, we could store a set of online users per room
        // For now, return 0 as placeholder
        return 0;
    }

    private String generateRoomCode() {
        // Generate a 6-character alphanumeric code
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String code = uuid.substring(0, 6).toUpperCase();
        
        // Ensure uniqueness (very low probability of collision, but check anyway)
        while (roomRepository.findByCode(code).isPresent()) {
            uuid = UUID.randomUUID().toString().replace("-", "");
            code = uuid.substring(0, 6).toUpperCase();
        }
        
        return code;
    }

    private void cacheRoom(Room room) {
        Map<String, Object> roomData = new HashMap<>();
        roomData.put("id", room.getId());
        roomData.put("code", room.getCode());
        roomData.put("name", room.getName());
        roomData.put("description", room.getDescription());
        roomData.put("maxUsers", room.getMaxUsers());
        roomData.put("isPublic", room.getIsPublic());
        roomData.put("ownerSessionId", room.getOwnerSessionId());
        roomData.put("videoUrl", room.getVideoUrl());
        roomData.put("videoTitle", room.getVideoTitle());
        roomData.put("videoDuration", room.getVideoDuration());
        roomData.put("currentPlaybackTime", room.getCurrentPlaybackTime());
        roomData.put("isPlaying", room.getIsPlaying());
        roomData.put("lastActivityAt", room.getLastActivityAt() != null ? room.getLastActivityAt().toString() : null);
        roomData.put("createdAt", room.getCreatedAt() != null ? room.getCreatedAt().toString() : null);
        roomData.put("updatedAt", room.getUpdatedAt() != null ? room.getUpdatedAt().toString() : null);
        
        redisUtil.setRoom(room.getId().toString(), roomData);
    }

    private Room mapToRoom(Map<String, Object> data) {
        Room room = new Room();
        room.setId(Long.valueOf(data.get("id").toString()));
        room.setCode((String) data.get("code"));
        room.setName((String) data.get("name"));
        room.setDescription((String) data.get("description"));
        room.setMaxUsers(Integer.valueOf(data.get("maxUsers").toString()));
        room.setIsPublic(Boolean.valueOf(data.get("isPublic").toString()));
        room.setOwnerSessionId((String) data.get("ownerSessionId"));
        room.setVideoUrl((String) data.get("videoUrl"));
        room.setVideoTitle((String) data.get("videoTitle"));
        
        Object videoDuration = data.get("videoDuration");
        if (videoDuration != null) {
            room.setVideoDuration(Integer.valueOf(videoDuration.toString()));
        }
        
        Object currentPlaybackTime = data.get("currentPlaybackTime");
        if (currentPlaybackTime != null) {
            room.setCurrentPlaybackTime(Double.valueOf(currentPlaybackTime.toString()));
        }
        
        Object isPlaying = data.get("isPlaying");
        if (isPlaying != null) {
            room.setIsPlaying(Boolean.valueOf(isPlaying.toString()));
        }
        
        // Note: Dates are stored as strings, not converting back for simplicity
        // In real implementation, you'd parse the strings
        
        return room;
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
        response.setInviteLink(generateInviteLink(room.getCode()));
        
        return response;
    }
}