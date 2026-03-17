package com.watchtogether.integration;

import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class RoomRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RoomRepository roomRepository;

    private Room publicRoom1;
    private Room publicRoom2;
    private Room privateRoom;

    @BeforeEach
    void setUp() {
        // Clear any existing data
        entityManager.clear();

        // Create test rooms
        publicRoom1 = new Room();
        publicRoom1.setCode("PUB123");
        publicRoom1.setName("Public Room 1");
        publicRoom1.setDescription("First public room");
        publicRoom1.setMaxUsers(10);
        publicRoom1.setIsPublic(true);
        publicRoom1.setOwnerSessionId("session-1");
        publicRoom1.setLastActivityAt(LocalDateTime.now().minusHours(1));
        entityManager.persist(publicRoom1);

        publicRoom2 = new Room();
        publicRoom2.setCode("PUB456");
        publicRoom2.setName("Public Room 2");
        publicRoom2.setDescription("Second public room");
        publicRoom2.setMaxUsers(20);
        publicRoom2.setIsPublic(true);
        publicRoom2.setOwnerSessionId("session-2");
        publicRoom2.setLastActivityAt(LocalDateTime.now().minusMinutes(30));
        entityManager.persist(publicRoom2);

        privateRoom = new Room();
        privateRoom.setCode("PRIV78");
        privateRoom.setName("Private Room");
        privateRoom.setDescription("Private room");
        privateRoom.setMaxUsers(5);
        privateRoom.setIsPublic(false);
        privateRoom.setOwnerSessionId("session-3");
        privateRoom.setLastActivityAt(LocalDateTime.now().minusMinutes(10));
        entityManager.persist(privateRoom);

        entityManager.flush();
    }

    @Test
    void findByCode_WithExistingCode_ShouldReturnRoom() {
        // Act
        Optional<Room> result = roomRepository.findByCode("PUB123");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Public Room 1", result.get().getName());
        assertEquals("session-1", result.get().getOwnerSessionId());
    }

    @Test
    void findByCode_WithNonExistentCode_ShouldReturnEmpty() {
        // Act
        Optional<Room> result = roomRepository.findByCode("NONEXIST");

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    void findByIsPublicTrueOrderByLastActivityAtDesc_ShouldReturnOnlyPublicRoomsOrdered() {
        // Act
        List<Room> result = roomRepository.findByIsPublicTrueOrderByLastActivityAtDesc();

        // Assert
        assertEquals(2, result.size());
        // Should be ordered by lastActivityAt descending (most recent first)
        assertEquals("PUB456", result.get(0).getCode()); // More recent (30 min ago)
        assertEquals("PUB123", result.get(1).getCode()); // Older (1 hour ago)
        
        // Should not include private room
        assertTrue(result.stream().noneMatch(r -> !r.getIsPublic()));
    }

    @Test
    void updateLastActivity_ShouldUpdateLastActivityAt() {
        // Arrange
        LocalDateTime newActivityTime = LocalDateTime.now().plusHours(1);

        // Act
        roomRepository.updateLastActivity(publicRoom1.getId(), newActivityTime);
        
        // Verify the update
        entityManager.clear(); // Clear persistence context to force reload from DB
        Room updatedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertNotNull(updatedRoom);
        // Compare without nanoseconds
        assertTrue(updatedRoom.getLastActivityAt().withNano(0)
                .isEqual(newActivityTime.withNano(0)));
    }

    @Test
    void updateLastActivity_WithNonExistentRoomId_ShouldNotFail() {
        // This should not throw exception, just do nothing
        assertDoesNotThrow(() -> {
            roomRepository.updateLastActivity(999L, LocalDateTime.now());
        });
    }

    @Test
    void updateVideoInfo_ShouldUpdateVideoFields() {
        // Arrange
        String newVideoUrl = "https://example.com/new-video.mp4";
        String newVideoTitle = "New Video Title";
        Integer newVideoDuration = 300;

        // Act
        roomRepository.updateVideoInfo(
                publicRoom1.getId(), newVideoUrl, newVideoTitle, newVideoDuration);

        // Assert
        // Verify the update
        entityManager.clear();
        Room updatedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertEquals(newVideoUrl, updatedRoom.getVideoUrl());
        assertEquals(newVideoTitle, updatedRoom.getVideoTitle());
        assertEquals(newVideoDuration, updatedRoom.getVideoDuration());
    }

    @Test
    void updateVideoInfo_WithNullValues_ShouldUpdateOnlyNonNullFields() {
        // Arrange
        String newVideoUrl = "https://example.com/another-video.mp4";

        // Act
        roomRepository.updateVideoInfo(
                publicRoom1.getId(), newVideoUrl, null, null);

        // Assert
        // Verify the update
        entityManager.clear();
        Room updatedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertEquals(newVideoUrl, updatedRoom.getVideoUrl());
        // Original values should remain for null parameters
        assertNull(updatedRoom.getVideoTitle());
        assertNull(updatedRoom.getVideoDuration());
    }

    @Test
    void updatePlaybackState_ShouldUpdatePlaybackFields() {
        // Arrange
        Double newCurrentTime = 120.5;
        Boolean newIsPlaying = true;
        LocalDateTime updateTime = LocalDateTime.now().plusHours(2);

        // Act
        roomRepository.updatePlaybackState(
                publicRoom1.getId(), newCurrentTime, newIsPlaying, updateTime);

        // Assert
        // Verify the update
        entityManager.clear();
        Room updatedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertEquals(newCurrentTime, updatedRoom.getCurrentPlaybackTime());
        assertEquals(newIsPlaying, updatedRoom.getIsPlaying());
        // Last activity should also be updated to the provided time
        assertTrue(updatedRoom.getLastActivityAt().withNano(0)
                .isEqual(updateTime.withNano(0)));
    }

    @Test
    void saveRoom_ShouldGenerateTimestamps() {
        // Arrange
        Room newRoom = new Room();
        newRoom.setCode("NEW123");
        newRoom.setName("New Room");
        newRoom.setMaxUsers(15);
        newRoom.setIsPublic(true);
        newRoom.setOwnerSessionId("session-new");

        // Act
        Room savedRoom = roomRepository.save(newRoom);
        entityManager.flush();
        entityManager.clear();

        // Assert
        assertNotNull(savedRoom.getId());
        assertNotNull(savedRoom.getCreatedAt());
        assertNotNull(savedRoom.getUpdatedAt());
        assertNotNull(savedRoom.getLastActivityAt());
        
        // Created and updated timestamps should be approximately the same initially
        long diffSeconds = Math.abs(savedRoom.getCreatedAt().getSecond() - savedRoom.getUpdatedAt().getSecond());
        assertTrue(diffSeconds < 2); // Within 2 seconds
    }

    @Test
    void updateRoom_ShouldUpdateUpdatedAtTimestamp() throws InterruptedException {
        // Arrange
        Room room = entityManager.find(Room.class, publicRoom1.getId());
        String originalName = room.getName();
        
        // Small delay to ensure timestamp difference
        Thread.sleep(10);
        
        // Act
        room.setName("Updated Name");
        Room updatedRoom = roomRepository.save(room);
        entityManager.flush();
        entityManager.clear();

        // Assert
        Room reloadedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertEquals("Updated Name", reloadedRoom.getName());
        assertTrue(reloadedRoom.getUpdatedAt().isAfter(reloadedRoom.getCreatedAt()));
    }

    @Test
    void deleteRoom_ShouldRemoveRoomFromDatabase() {
        // Act
        roomRepository.delete(publicRoom1);
        entityManager.flush();
        entityManager.clear();

        // Assert
        Room deletedRoom = entityManager.find(Room.class, publicRoom1.getId());
        assertNull(deletedRoom);
    }

    @Test
    void countAllRooms_ShouldReturnTotalCount() {
        // Act
        long count = roomRepository.count();

        // Assert
        assertEquals(3, count);
    }

    @Test
    void findById_WithExistingId_ShouldReturnRoom() {
        // Act
        Optional<Room> result = roomRepository.findById(publicRoom1.getId());

        // Assert
        assertTrue(result.isPresent());
        assertEquals(publicRoom1.getCode(), result.get().getCode());
    }

    @Test
    void findById_WithNonExistentId_ShouldReturnEmpty() {
        // Act
        Optional<Room> result = roomRepository.findById(999L);

        // Assert
        assertFalse(result.isPresent());
    }
}