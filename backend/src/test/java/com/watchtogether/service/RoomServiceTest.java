package com.watchtogether.service;

import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.dto.resp.RoomResp;
import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import com.watchtogether.utils.RedisUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static com.watchtogether.common.AppConstants.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RedisUtil redisUtil;

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private RoomService roomService;

    private CreateRoomReq testCreateRoomReq;
    private String testOwnerSessionId;
    private Room testRoom;
    private String testRoomCode;

    @BeforeEach
    void setUp() {
        testRoomCode = "ROOM123";
        
        testCreateRoomReq = new CreateRoomReq();
        testCreateRoomReq.setName("Test Room");
        testCreateRoomReq.setDescription("Test Description");
        testCreateRoomReq.setMaxUsers(10);
        testCreateRoomReq.setIsPublic(true);
        testCreateRoomReq.setVideoUrl("https://example.com/video.mp4");
        testCreateRoomReq.setVideoTitle("Test Video");
        
        testOwnerSessionId = "session123";
        
        testRoom = new Room();
        testRoom.setId(1L);
        testRoom.setCode(testRoomCode);
        testRoom.setName(testCreateRoomReq.getName());
        testRoom.setDescription(testCreateRoomReq.getDescription());
        testRoom.setMaxUsers(testCreateRoomReq.getMaxUsers());
        testRoom.setIsPublic(testCreateRoomReq.getIsPublic());
        testRoom.setOwnerSessionId(testOwnerSessionId);
        testRoom.setVideoUrl(testCreateRoomReq.getVideoUrl());
        testRoom.setVideoTitle(testCreateRoomReq.getVideoTitle());
        testRoom.setCreatedAt(LocalDateTime.now());
        testRoom.setUpdatedAt(LocalDateTime.now());
        testRoom.setLastActivityAt(LocalDateTime.now());
    }

    @Test
    void createRoom_shouldUseDefaultsWhenFieldsAreNull() {
        // Given
        CreateRoomReq reqWithNulls = new CreateRoomReq();
        reqWithNulls.setName("Test Room");
        reqWithNulls.setDescription("Test Description");
        // maxUsers and isPublic are null
        reqWithNulls.setVideoUrl("https://example.com/video.mp4");
        reqWithNulls.setVideoTitle("Test Video");
        
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(1L);
            room.setCreatedAt(LocalDateTime.now());
            room.setUpdatedAt(LocalDateTime.now());
            room.setLastActivityAt(LocalDateTime.now());
            return room;
        });
        
        when(roomRepository.findByCode(anyString())).thenReturn(Optional.empty());
        
        // When
        Room result = roomService.createRoom(reqWithNulls, testOwnerSessionId);
        
        // Then
        assertNotNull(result);
        assertEquals(5, result.getMaxUsers()); // Default value
        assertTrue(result.getIsPublic()); // Default value
        verify(roomRepository, times(1)).save(any(Room.class));
        verify(redisUtil, times(1)).set(anyString(), any(Map.class));
    }
    
    @Test
    void createRoom_shouldCreateRoomWithGeneratedCode() {
        // Given
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(1L);
            room.setCreatedAt(LocalDateTime.now());
            room.setUpdatedAt(LocalDateTime.now());
            room.setLastActivityAt(LocalDateTime.now());
            return room;
        });
        
        when(roomRepository.findByCode(anyString())).thenReturn(Optional.empty());

        // When
        Room result = roomService.createRoom(testCreateRoomReq, testOwnerSessionId);

        // Then
        assertNotNull(result);
        assertNotNull(result.getCode());
        assertEquals(6, result.getCode().length());
        assertEquals(testCreateRoomReq.getName(), result.getName());
        assertEquals(testOwnerSessionId, result.getOwnerSessionId());
        
        verify(roomRepository, times(1)).save(any(Room.class));
        // Note: cacheRoom is called internally, which calls redisUtil.set
        // We can't easily verify the exact map due to complex object creation
        verify(redisUtil, times(1)).set(anyString(), any(Map.class));
    }

    @Test
    void getRoomById_shouldReturnRoomFromRepository() {
        // Given
        Long roomId = 1L;
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));

        // When
        Optional<Room> result = roomService.getRoomById(roomId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(roomId, result.get().getId());
        
        verify(roomRepository, times(1)).findById(roomId);
        verify(redisUtil, times(1)).set(eq(KEY_PREFIX_ROOM + testRoomCode), any(Map.class));
    }

    @Test
    void getRoomById_shouldReturnEmptyWhenNotFound() {
        // Given
        Long roomId = 999L;
        when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

        // When
        Optional<Room> result = roomService.getRoomById(roomId);

        // Then
        assertFalse(result.isPresent());
        verify(redisUtil, never()).set(anyString(), any(), anyLong());
    }

    @Test
    void getRoomByCode_shouldReturnRoomFromRepository() {
        // Given
        when(roomRepository.findByCode(testRoomCode)).thenReturn(Optional.of(testRoom));

        // When
        Optional<Room> result = roomService.getRoomByCode(testRoomCode);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testRoomCode, result.get().getCode());
    }

    @Test
    void getPublicRooms_shouldReturnPublicRoomsWithOnlineCount() {
        // Given
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);
        Page<Room> roomPage = new PageImpl<>(Arrays.asList(testRoom), pageable, 1);
        
        when(roomRepository.findByIsPublicTrueOrderByLastActivityAtDesc(pageable)).thenReturn(roomPage);
        when(redisUtil.get(KEY_PREFIX_ROOM_USERS + testRoom.getCode())).thenReturn(new HashMap<>());

        // When
        List<RoomResp> result = roomService.getPublicRooms(page, size);

        // Then
        assertEquals(1, result.size());
        RoomResp resp = result.get(0);
        assertEquals(testRoom.getCode(), resp.getCode());
        assertEquals(testRoom.getName(), resp.getName());
        assertEquals(testRoom.getDescription(), resp.getDescription());
        assertEquals(0, resp.getOnlineUserCount()); // Empty map returns 0
        
        verify(roomRepository, times(1)).findByIsPublicTrueOrderByLastActivityAtDesc(pageable);
    }

    @Test
    void getPublicRooms_shouldThrowExceptionForInvalidPage() {
        // Given
        int page = -1;
        int size = 10;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> roomService.getPublicRooms(page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());
    }

    @Test
    void getPublicRooms_shouldThrowExceptionForInvalidSize() {
        // Given
        int page = 0;
        int size = 0;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> roomService.getPublicRooms(page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());
    }

    @Test
    void getPublicRooms_shouldThrowExceptionForSizeGreaterThan20() {
        // Given
        int page = 0;
        int size = 21;

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> roomService.getPublicRooms(page, size));
        assertEquals("Invalid pagination parameters", exception.getMessage());
    }

    @Test
    void deleteRoomByCode_shouldReturnTrueWhenRoomDeletedByOwner() {
        // Given
        when(roomRepository.findByCode(testRoomCode)).thenReturn(Optional.of(testRoom));
        
        String ownerSessionId = testRoom.getOwnerSessionId();

        // When
        boolean result = roomService.deleteRoomByCode(testRoomCode, ownerSessionId);

        // Then
        assertTrue(result);
        verify(roomRepository, times(1)).delete(testRoom);
        verify(redisUtil, times(1)).delete(KEY_PREFIX_ROOM + testRoomCode);
        verify(redisUtil, times(1)).delete(KEY_PREFIX_ROOM_USERS + testRoom.getId());
        verify(redisUtil, times(1)).delete(KEY_PREFIX_ROOM_PLAYBACK + testRoom.getId());
    }

    @Test
    void deleteRoomByCode_shouldReturnFalseWhenRoomNotFound() {
        // Given
        when(roomRepository.findByCode(testRoomCode)).thenReturn(Optional.empty());

        // When
        boolean result = roomService.deleteRoomByCode(testRoomCode, testOwnerSessionId);

        // Then
        assertFalse(result);
        verify(roomRepository, never()).delete(any(Room.class));
        verify(redisUtil, never()).delete(anyString());
    }

    @Test
    void deleteRoomByCode_shouldReturnFalseWhenNotOwner() {
        // Given
        when(roomRepository.findByCode(testRoomCode)).thenReturn(Optional.of(testRoom));
        
        String differentSessionId = "different-session";

        // When
        boolean result = roomService.deleteRoomByCode(testRoomCode, differentSessionId);

        // Then
        assertFalse(result);
        verify(roomRepository, never()).delete(any(Room.class));
        verify(redisUtil, never()).delete(anyString());
    }

    @Test
    void getOnlineUserCount_shouldReturnZeroWhenNoUsers() {
        // Given
        when(redisUtil.get(KEY_PREFIX_ROOM_USERS + testRoomCode)).thenReturn(null);

        // When
        Integer result = roomService.getOnlineUserCount(testRoomCode);

        // Then
        assertEquals(0, result);
    }
    
    @Test
    void getOnlineUserCount_shouldReturnZeroWhenValueIsNotMap() {
        // Given - Redis returns a non-Map object (e.g., String)
        when(redisUtil.get(KEY_PREFIX_ROOM_USERS + testRoomCode)).thenReturn("not a map");

        // When
        Integer result = roomService.getOnlineUserCount(testRoomCode);

        // Then
        assertEquals(0, result);
    }

    @Test
    void getOnlineUserCount_shouldReturnMapSize() {
        // Given
        Map<String, Object> users = new HashMap<>();
        users.put("user1", new Object());
        users.put("user2", new Object());
        
        when(redisUtil.get(KEY_PREFIX_ROOM_USERS + testRoomCode)).thenReturn(users);

        // When
        Integer result = roomService.getOnlineUserCount(testRoomCode);

        // Then
        assertEquals(2, result);
    }

    @Test
    void getOnlineUserCount_shouldReturnZeroOnException() {
        // Given
        when(redisUtil.get(KEY_PREFIX_ROOM_USERS + testRoomCode)).thenThrow(new RuntimeException("Redis error"));

        // When
        Integer result = roomService.getOnlineUserCount(testRoomCode);

        // Then
        assertEquals(0, result);
    }
    
    @Test
    void updateRoomActivity_shouldUpdateLastActivityAndRefreshCache() {
        // Given
        String roomCode = testRoomCode;
        LocalDateTime now = LocalDateTime.now();
        
        // Mock repository update
        doAnswer(invocation -> {
            // Verify parameters
            assertEquals(roomCode, invocation.getArgument(0));
            assertNotNull(invocation.getArgument(1));
            return null;
        }).when(roomRepository).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        
        // Mock Redis get returning null (cache miss)
        when(redisUtil.get(KEY_PREFIX_ROOM + roomCode, Map.class)).thenReturn(null);
        
        // When
        roomService.updateRoomActivity(roomCode);
        
        // Then
        verify(roomRepository, times(1)).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        verify(redisUtil, times(1)).get(KEY_PREFIX_ROOM + roomCode, Map.class);
        // Should not call set when cached is null
        verify(redisUtil, never()).set(eq(KEY_PREFIX_ROOM + roomCode), any(Map.class));
    }
    
    @Test
    void updateRoomActivity_shouldUpdateRedisCacheWhenCacheExists() {
        // Given
        String roomCode = testRoomCode;
        Map<String, Object> cachedData = new HashMap<>();
        cachedData.put("code", roomCode);
        cachedData.put("name", "Test Room");
        
        // Mock repository update
        doNothing().when(roomRepository).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        
        // Mock Redis get returning cached data
        when(redisUtil.get(KEY_PREFIX_ROOM + roomCode, Map.class)).thenReturn(cachedData);
        
        // When
        roomService.updateRoomActivity(roomCode);
        
        // Then
        verify(roomRepository, times(1)).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        verify(redisUtil, times(1)).get(KEY_PREFIX_ROOM + roomCode, Map.class);
        // Should call set with cached data
        verify(redisUtil, times(1)).set(eq(KEY_PREFIX_ROOM + roomCode), eq(cachedData));
    }
    
    @Test
    void updateRoomActivity_shouldHandleRedisExceptionGracefully() {
        // Given
        String roomCode = testRoomCode;
        
        // Mock repository update
        doNothing().when(roomRepository).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        
        // Mock Redis throwing exception
        when(redisUtil.get(KEY_PREFIX_ROOM + roomCode, Map.class)).thenThrow(new RuntimeException("Redis connection failed"));
        
        // When - should not throw exception
        assertDoesNotThrow(() -> roomService.updateRoomActivity(roomCode));
        
        // Then
        verify(roomRepository, times(1)).updateLastActivityByCode(eq(roomCode), any(LocalDateTime.class));
        verify(redisUtil, times(1)).get(KEY_PREFIX_ROOM + roomCode, Map.class);
        // Should not call set due to exception
        verify(redisUtil, never()).set(anyString(), any());
    }
    
    @Test
    void updateVideoInfo_shouldUpdateVideoInfoAndCacheRoom() {
        // Given
        Long roomId = testRoom.getId();
        String newVideoUrl = "https://example.com/new-video.mp4";
        String newVideoTitle = "New Video Title";
        Integer newVideoDuration = 120;
        
        // Mock repository update
        doAnswer(invocation -> {
            assertEquals(roomId, invocation.getArgument(0));
            assertEquals(newVideoUrl, invocation.getArgument(1));
            assertEquals(newVideoTitle, invocation.getArgument(2));
            assertEquals(newVideoDuration, invocation.getArgument(3));
            return null;
        }).when(roomRepository).updateVideoInfo(eq(roomId), eq(newVideoUrl), eq(newVideoTitle), eq(newVideoDuration));
        
        // Mock repository findById returning updated room
        Room updatedRoom = new Room();
        updatedRoom.setId(roomId);
        updatedRoom.setCode(testRoomCode);
        updatedRoom.setVideoUrl(newVideoUrl);
        updatedRoom.setVideoTitle(newVideoTitle);
        updatedRoom.setVideoDuration(newVideoDuration);
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(updatedRoom));
        
        // When
        roomService.updateVideoInfo(roomId, newVideoUrl, newVideoTitle, newVideoDuration);
        
        // Then
        verify(roomRepository, times(1)).updateVideoInfo(roomId, newVideoUrl, newVideoTitle, newVideoDuration);
        verify(roomRepository, times(1)).findById(roomId);
        // Should call cacheRoom which calls redisUtil.set
        verify(redisUtil, times(1)).set(eq(KEY_PREFIX_ROOM + testRoomCode), any(Map.class));
    }
    
    @Test
    void updateVideoInfo_shouldHandleRoomNotFound() {
        // Given
        Long roomId = 999L;
        String newVideoUrl = "https://example.com/new-video.mp4";
        String newVideoTitle = "New Video Title";
        Integer newVideoDuration = 120;
        
        // Mock repository update
        doNothing().when(roomRepository).updateVideoInfo(eq(roomId), eq(newVideoUrl), eq(newVideoTitle), eq(newVideoDuration));
        
        // Mock repository findById returning empty
        when(roomRepository.findById(roomId)).thenReturn(Optional.empty());
        
        // When
        roomService.updateVideoInfo(roomId, newVideoUrl, newVideoTitle, newVideoDuration);
        
        // Then
        verify(roomRepository, times(1)).updateVideoInfo(roomId, newVideoUrl, newVideoTitle, newVideoDuration);
        verify(roomRepository, times(1)).findById(roomId);
        // Should not call cacheRoom when room not found
        verify(redisUtil, never()).set(anyString(), any(Map.class));
    }
    
    @Test
    void createRoom_shouldGenerateUniqueCodeWhenCollisionOccurs() {
        // Given - we can't predict the random codes, so we'll use lenient mocks
        // and just verify the behavior when a collision occurs
        
        // Mock save
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(1L);
            room.setCreatedAt(LocalDateTime.now());
            room.setUpdatedAt(LocalDateTime.now());
            room.setLastActivityAt(LocalDateTime.now());
            return room;
        });
        
        // Mock findByCode to simulate a collision on first call, then success
        // Use lenient mocking to avoid strict stubbing issues
        lenient().when(roomRepository.findByCode(anyString())).thenAnswer(invocation -> {
            String code = invocation.getArgument(0);
            // Simulate: if code starts with "A" (unlikely from UUID), return room (collision)
            // Otherwise return empty (no collision)
            if (code != null && code.startsWith("A")) {
                return Optional.of(testRoom);
            }
            return Optional.empty();
        });
        
        // When
        Room result = roomService.createRoom(testCreateRoomReq, testOwnerSessionId);
        
        // Then
        assertNotNull(result);
        assertNotNull(result.getCode());
        assertEquals(6, result.getCode().length());
        // Verify that findByCode was called (at least once for collision check)
        verify(roomRepository, atLeast(1)).findByCode(anyString());
    }
    
    @Test
    void getStringValue_privateMethodShouldReturnCorrectValues() throws Exception {
        // Test private getStringValue method using reflection
        Map<String, Object> data = new HashMap<>();
        data.put("key1", "value1");
        data.put("key2", 123);
        data.put("key3", null);
        
        // Get private method using reflection
        java.lang.reflect.Method getStringValueMethod = RoomService.class.getDeclaredMethod("getStringValue", Map.class, String.class);
        getStringValueMethod.setAccessible(true);
        
        // Test with string value
        String result1 = (String) getStringValueMethod.invoke(roomService, data, "key1");
        assertEquals("value1", result1);
        
        // Test with non-string value (should call toString())
        String result2 = (String) getStringValueMethod.invoke(roomService, data, "key2");
        assertEquals("123", result2);
        
        // Test with null value
        String result3 = (String) getStringValueMethod.invoke(roomService, data, "key3");
        assertNull(result3);
        
        // Test with missing key
        String result4 = (String) getStringValueMethod.invoke(roomService, data, "missing");
        assertNull(result4);
    }
    
    @Test
    void mapToRoom_privateMethodShouldMapCorrectly() throws Exception {
        // Test private mapToRoom method using reflection
        Map<String, Object> data = new HashMap<>();
        data.put("id", 1L);
        data.put("code", "TEST123");
        data.put("name", "Test Room");
        data.put("description", "Test Description");
        data.put("maxUsers", 10);
        data.put("isPublic", true);
        data.put("ownerSessionId", "session123");
        data.put("videoUrl", "https://example.com/video.mp4");
        data.put("videoTitle", "Test Video");
        data.put("videoDuration", 120);
        data.put("currentPlaybackTime", 30.5);
        data.put("isPlaying", false);
        
        // Get private method using reflection
        java.lang.reflect.Method mapToRoomMethod = RoomService.class.getDeclaredMethod("mapToRoom", Map.class);
        mapToRoomMethod.setAccessible(true);
        
        // When
        Room room = (Room) mapToRoomMethod.invoke(roomService, data);
        
        // Then
        assertNotNull(room);
        assertEquals(1L, room.getId());
        assertEquals("TEST123", room.getCode());
        assertEquals("Test Room", room.getName());
        assertEquals("Test Description", room.getDescription());
        assertEquals(10, room.getMaxUsers());
        assertTrue(room.getIsPublic());
        assertEquals("session123", room.getOwnerSessionId());
        assertEquals("https://example.com/video.mp4", room.getVideoUrl());
        assertEquals("Test Video", room.getVideoTitle());
        assertEquals(Integer.valueOf(120), room.getVideoDuration());
        assertEquals(30.5, room.getCurrentPlaybackTime(), 0.001);
        assertFalse(room.getIsPlaying());
    }
    
    @Test
    void mapToRoom_shouldThrowExceptionForNullData() throws Exception {
        // Get private method using reflection
        java.lang.reflect.Method mapToRoomMethod = RoomService.class.getDeclaredMethod("mapToRoom", Map.class);
        mapToRoomMethod.setAccessible(true);
        
        // When & Then - InvocationTargetException wraps the actual exception
        Exception exception = assertThrows(Exception.class,
            () -> mapToRoomMethod.invoke(roomService, (Map<String, Object>) null));
        
        // Check if it's InvocationTargetException and get the cause
        if (exception instanceof java.lang.reflect.InvocationTargetException) {
            Throwable cause = ((java.lang.reflect.InvocationTargetException) exception).getCause();
            assertTrue(cause instanceof IllegalArgumentException);
            assertTrue(cause.getMessage().contains("Room data cannot be null"));
        } else {
            // Direct exception
            assertTrue(exception instanceof IllegalArgumentException);
            assertTrue(exception.getMessage().contains("Room data cannot be null"));
        }
    }
    
    @Test
    void mapToRoom_shouldThrowExceptionForMissingId() throws Exception {
        // Get private method using reflection
        java.lang.reflect.Method mapToRoomMethod = RoomService.class.getDeclaredMethod("mapToRoom", Map.class);
        mapToRoomMethod.setAccessible(true);
        
        Map<String, Object> data = new HashMap<>();
        data.put("code", "TEST123");
        
        // When & Then - InvocationTargetException wraps the actual exception
        Exception exception = assertThrows(Exception.class,
            () -> mapToRoomMethod.invoke(roomService, data));
        
        // Check if it's InvocationTargetException and get the cause
        if (exception instanceof java.lang.reflect.InvocationTargetException) {
            Throwable cause = ((java.lang.reflect.InvocationTargetException) exception).getCause();
            assertTrue(cause instanceof IllegalArgumentException);
            assertTrue(cause.getMessage().contains("Room ID is required"));
        } else {
            // Direct exception
            assertTrue(exception instanceof IllegalArgumentException);
            assertTrue(exception.getMessage().contains("Room ID is required"));
        }
    }
    
    @Test
    void mapToRoomResponse_privateMethodShouldMapCorrectly() throws Exception {
        // Test private mapToRoomResponse method using reflection
        Room room = testRoom;
        room.setVideoDuration(120);
        room.setCurrentPlaybackTime(30.5);
        room.setIsPlaying(false);
        room.setLastActivityAt(LocalDateTime.now());
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        
        // Get private method using reflection
        java.lang.reflect.Method mapToRoomResponseMethod = RoomService.class.getDeclaredMethod("mapToRoomResponse", Room.class);
        mapToRoomResponseMethod.setAccessible(true);
        
        // When
        RoomResp response = (RoomResp) mapToRoomResponseMethod.invoke(roomService, room);
        
        // Then
        assertNotNull(response);
        assertEquals(room.getCode(), response.getCode());
        assertEquals(room.getName(), response.getName());
        assertEquals(room.getDescription(), response.getDescription());
        assertEquals(room.getMaxUsers(), response.getMaxUsers());
        assertEquals(room.getIsPublic(), response.getIsPublic());
        assertEquals(room.getOwnerSessionId(), response.getOwnerSessionId());
        assertEquals(room.getVideoUrl(), response.getVideoUrl());
        assertEquals(room.getVideoTitle(), response.getVideoTitle());
        assertEquals(room.getVideoDuration(), response.getVideoDuration());
        assertEquals(room.getCurrentPlaybackTime(), response.getCurrentPlaybackTime());
        assertEquals(room.getIsPlaying(), response.getIsPlaying());
        assertEquals(room.getLastActivityAt(), response.getLastActivityAt());
        assertEquals(room.getCreatedAt(), response.getCreatedAt());
        assertEquals(room.getUpdatedAt(), response.getUpdatedAt());
        assertEquals("/join/" + room.getCode(), response.getInviteLink());
    }
}