package com.watchtogether.integration;

import com.watchtogether.config.SocketIOStartup;
import com.watchtogether.config.TestRedisConfig;
import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.dto.resp.RoomResp;
import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import com.watchtogether.service.RoomService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
@Transactional
class RoomServiceIntegrationTest {

    @MockBean
    private SocketIOStartup socketIOStartup;

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private EntityManager entityManager;

    private CreateRoomReq createRoomRequest;
    private String ownerSessionId;

    @BeforeEach
    void setUp() {
        ownerSessionId = "session-owner-123";

        createRoomRequest = new CreateRoomReq();
        createRoomRequest.setName("Test Room");
        createRoomRequest.setDescription("Test Description");
        createRoomRequest.setMaxUsers(10);
        createRoomRequest.setIsPublic(true);
        createRoomRequest.setVideoUrl("https://example.com/video.mp4");
        createRoomRequest.setVideoTitle("Test Video");
    }

    @Test
    void createRoom_WithValidRequest_ShouldPersistRoom() {
        Room result = roomService.createRoom(createRoomRequest, ownerSessionId);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertNotNull(result.getCode());
        assertEquals(6, result.getCode().length());
        assertEquals("Test Room", result.getName());
        assertEquals("Test Description", result.getDescription());
        assertEquals(10, result.getMaxUsers());
        assertTrue(result.getIsPublic());
        assertEquals(ownerSessionId, result.getOwnerSessionId());
        assertEquals("https://example.com/video.mp4", result.getVideoUrl());
        assertEquals("Test Video", result.getVideoTitle());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        assertNotNull(result.getLastActivityAt());

        Room persisted = roomRepository.findById(result.getId()).orElse(null);
        assertNotNull(persisted);
        assertEquals(result.getCode(), persisted.getCode());
    }

    @Test
    void createRoom_WithNullMaxUsers_ShouldUseDefault() {
        createRoomRequest.setMaxUsers(null);

        Room result = roomService.createRoom(createRoomRequest, ownerSessionId);

        assertEquals(5, result.getMaxUsers());
    }

    @Test
    void createRoom_WithNullIsPublic_ShouldDefaultToTrue() {
        createRoomRequest.setIsPublic(null);

        Room result = roomService.createRoom(createRoomRequest, ownerSessionId);

        assertTrue(result.getIsPublic());
    }

    @Test
    void createRoom_ShouldGenerateUniqueCode() {
        Room room1 = roomService.createRoom(createRoomRequest, ownerSessionId);

        createRoomRequest.setName("Second Room");
        Room room2 = roomService.createRoom(createRoomRequest, ownerSessionId);

        assertNotEquals(room1.getCode(), room2.getCode());
    }

    @Test
    void getRoomById_WithExistingRoom_ShouldReturnRoom() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);

        Optional<Room> result = roomService.getRoomById(created.getId());

        assertTrue(result.isPresent());
        assertEquals(created.getId(), result.get().getId());
        assertEquals(created.getCode(), result.get().getCode());
    }

    @Test
    void getRoomById_WithNonExistentId_ShouldReturnEmpty() {
        Optional<Room> result = roomService.getRoomById(99999L);

        assertFalse(result.isPresent());
    }

    @Test
    void getRoomByCode_WithExistingCode_ShouldReturnRoom() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);

        Optional<Room> result = roomService.getRoomByCode(created.getCode());

        assertTrue(result.isPresent());
        assertEquals(created.getId(), result.get().getId());
    }

    @Test
    void getRoomByCode_WithNonExistentCode_ShouldReturnEmpty() {
        Optional<Room> result = roomService.getRoomByCode("NONEXIST");

        assertFalse(result.isPresent());
    }

    @Test
    void getPublicRooms_ShouldReturnOnlyPublicRooms() {
        createRoomRequest.setIsPublic(true);
        Room publicRoom = roomService.createRoom(createRoomRequest, ownerSessionId);

        createRoomRequest.setName("Private Room");
        createRoomRequest.setIsPublic(false);
        roomService.createRoom(createRoomRequest, ownerSessionId);

        List<RoomResp> publicRooms = roomService.getPublicRooms();

        assertThat(publicRooms).hasSize(1);
        assertEquals(publicRoom.getId(), publicRooms.get(0).getId());
        assertTrue(publicRooms.get(0).getIsPublic());
    }

    @Test
    void getPublicRooms_ShouldBeOrderedByLastActivityDesc() throws InterruptedException {
        createRoomRequest.setIsPublic(true);
        Room room1 = roomService.createRoom(createRoomRequest, ownerSessionId);
        Thread.sleep(10);

        createRoomRequest.setName("Room 2");
        Room room2 = roomService.createRoom(createRoomRequest, ownerSessionId);
        Thread.sleep(10);

        createRoomRequest.setName("Room 3");
        Room room3 = roomService.createRoom(createRoomRequest, ownerSessionId);

        List<RoomResp> publicRooms = roomService.getPublicRooms();

        assertThat(publicRooms).hasSize(3);
        assertEquals(room3.getId(), publicRooms.get(0).getId());
        assertEquals(room2.getId(), publicRooms.get(1).getId());
        assertEquals(room1.getId(), publicRooms.get(2).getId());
    }

    @Test
    void deleteRoom_WithOwnerSession_ShouldDeleteRoom() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);
        Long roomId = created.getId();

        boolean result = roomService.deleteRoom(roomId, ownerSessionId);

        assertTrue(result);
        assertFalse(roomRepository.findById(roomId).isPresent());
    }

    @Test
    void deleteRoom_WithNonOwnerSession_ShouldReturnFalseAndNotDelete() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);
        Long roomId = created.getId();

        boolean result = roomService.deleteRoom(roomId, "different-session");

        assertFalse(result);
        assertTrue(roomRepository.findById(roomId).isPresent());
    }

    @Test
    void deleteRoom_WithNonExistentRoom_ShouldReturnFalse() {
        boolean result = roomService.deleteRoom(99999L, ownerSessionId);

        assertFalse(result);
    }

    @Test
    void updateVideoInfo_ShouldPersistChanges() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);
        Long roomId = created.getId();
        String newUrl = "https://example.com/new-video.mp4";
        String newTitle = "New Video Title";
        Integer newDuration = 300;

        roomService.updateVideoInfo(roomId, newUrl, newTitle, newDuration);
        entityManager.flush();
        entityManager.clear();

        Room updated = roomRepository.findById(roomId).orElse(null);
        assertNotNull(updated);
        assertEquals(newUrl, updated.getVideoUrl());
        assertEquals(newTitle, updated.getVideoTitle());
        assertEquals(newDuration, updated.getVideoDuration());
    }

    @Test
    void updatePlaybackState_ShouldPersistChanges() {
        Room created = roomService.createRoom(createRoomRequest, ownerSessionId);
        Long roomId = created.getId();
        Double newTime = 120.5;
        Boolean isPlaying = true;

        roomService.updatePlaybackState(roomId, newTime, isPlaying);
        entityManager.flush();
        entityManager.clear();

        Room updated = roomRepository.findById(roomId).orElse(null);
        assertNotNull(updated);
        assertEquals(newTime, updated.getCurrentPlaybackTime());
        assertEquals(isPlaying, updated.getIsPlaying());
    }

    @Test
    void generateInviteLink_ShouldReturnCorrectFormat() {
        String inviteLink = roomService.generateInviteLink("ABC123");

        assertEquals("/join/ABC123", inviteLink);
    }

    @Test
    void createRoom_WithVideoInfo_ShouldPersistAllFields() {
        createRoomRequest.setVideoUrl("https://example.com/test.mp4");
        createRoomRequest.setVideoTitle("Full Test Video");

        Room result = roomService.createRoom(createRoomRequest, ownerSessionId);

        Room persisted = roomRepository.findById(result.getId()).orElse(null);
        assertNotNull(persisted);
        assertEquals("https://example.com/test.mp4", persisted.getVideoUrl());
        assertEquals("Full Test Video", persisted.getVideoTitle());
    }

    @Test
    void createMultipleRooms_ShouldHaveUniqueCodes() {
        Room room1 = roomService.createRoom(createRoomRequest, ownerSessionId);
        createRoomRequest.setName("Room 2");
        Room room2 = roomService.createRoom(createRoomRequest, ownerSessionId);
        createRoomRequest.setName("Room 3");
        Room room3 = roomService.createRoom(createRoomRequest, ownerSessionId);

        assertNotEquals(room1.getCode(), room2.getCode());
        assertNotEquals(room2.getCode(), room3.getCode());
        assertNotEquals(room1.getCode(), room3.getCode());

        assertThat(roomRepository.findAll()).hasSize(3);
    }

    @Test
    void getPublicRooms_WithNoPublicRooms_ShouldReturnEmptyList() {
        createRoomRequest.setIsPublic(false);
        roomService.createRoom(createRoomRequest, ownerSessionId);

        List<RoomResp> publicRooms = roomService.getPublicRooms();

        assertThat(publicRooms).isEmpty();
    }
}