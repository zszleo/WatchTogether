package com.watchtogether.integration;

import com.watchtogether.config.SocketIOStartup;
import com.watchtogether.config.TestRedisConfig;
import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.service.SessionService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
@Transactional
class SessionServiceIntegrationTest {

    @MockBean
    private SocketIOStartup socketIOStartup;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private EntityManager entityManager;

    private String nickname;
    private String avatar;

    @BeforeEach
    void setUp() {
        nickname = "TestUser";
        avatar = "https://example.com/avatar.png";
    }

    @Test
    void createSession_WithValidData_ShouldPersistSession() {
        Session result = sessionService.createSession(nickname, avatar);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(32, result.getId().length());
        assertEquals(nickname, result.getNickname());
        assertEquals(avatar, result.getAvatar());
        assertFalse(result.getIsOnline());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        assertNotNull(result.getLastSeenAt());

        Session persisted = sessionRepository.findById(result.getId()).orElse(null);
        assertNotNull(persisted);
        assertEquals(nickname, persisted.getNickname());
    }

    @Test
    void createSession_WithNullAvatar_ShouldPersist() {
        Session result = sessionService.createSession(nickname, null);

        assertNotNull(result);
        assertNull(result.getAvatar());

        Session persisted = sessionRepository.findById(result.getId()).orElse(null);
        assertNotNull(persisted);
        assertNull(persisted.getAvatar());
    }

    @Test
    void createSession_ShouldGenerateUniqueIds() {
        Session session1 = sessionService.createSession(nickname, avatar);
        Session session2 = sessionService.createSession("AnotherUser", avatar);

        assertNotEquals(session1.getId(), session2.getId());

        assertThat(sessionRepository.findAll()).hasSize(2);
    }

    @Test
    void getSession_WithExistingId_ShouldReturnSession() {
        Session created = sessionService.createSession(nickname, avatar);

        Optional<Session> result = sessionService.getSession(created.getId());

        assertTrue(result.isPresent());
        assertEquals(created.getId(), result.get().getId());
        assertEquals(nickname, result.get().getNickname());
    }

    @Test
    void getSession_WithNonExistentId_ShouldReturnEmpty() {
        Optional<Session> result = sessionService.getSession("nonexistent-session-id");

        assertFalse(result.isPresent());
    }

    @Test
    void validateSession_WithExistingSession_ShouldReturnTrue() {
        Session created = sessionService.createSession(nickname, avatar);

        boolean isValid = sessionService.validateSession(created.getId());

        assertTrue(isValid);
    }

    @Test
    void validateSession_WithNonExistentSession_ShouldReturnFalse() {
        boolean isValid = sessionService.validateSession("nonexistent-session");

        assertFalse(isValid);
    }

    @Test
    void validateSession_WithNullSessionId_ShouldReturnFalse() {
        boolean isValid = sessionService.validateSession(null);

        assertFalse(isValid);
    }

    @Test
    void validateSession_WithEmptySessionId_ShouldReturnFalse() {
        boolean isValid = sessionService.validateSession("");

        assertFalse(isValid);
    }

    @Test
    void updateSessionSocket_ShouldPersistSocketInfo() {
        Session created = sessionService.createSession(nickname, avatar);
        String socketId = "socket-abc123";

        sessionService.updateSessionSocket(created.getId(), socketId);
        entityManager.flush();
        entityManager.clear();

        Session updated = sessionRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals(socketId, updated.getSocketId());
        assertTrue(updated.getIsOnline());
    }

    @Test
    void updateSessionLastSeen_ShouldUpdateTimestamp() throws InterruptedException {
        Session created = sessionService.createSession(nickname, avatar);
        var originalLastSeen = created.getLastSeenAt();

        Thread.sleep(10);
        sessionService.updateSessionLastSeen(created.getId());

        Session updated = sessionRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertTrue(updated.getLastSeenAt().isAfter(originalLastSeen));
    }

    @Test
    void deleteSession_WithExistingSession_ShouldRemoveSession() {
        Session created = sessionService.createSession(nickname, avatar);
        String sessionId = created.getId();

        sessionService.deleteSession(sessionId);

        assertFalse(sessionRepository.findById(sessionId).isPresent());
    }

    @Test
    void deleteSession_WithNonExistentSession_ShouldNotThrow() {
        assertDoesNotThrow(() -> sessionService.deleteSession("nonexistent-session"));
    }

    @Test
    void joinRoom_ShouldUpdateSessionWithRoomId() {
        Session created = sessionService.createSession(nickname, avatar);
        Long roomId = 123L;

        sessionService.joinRoom(created.getId(), roomId);
        entityManager.flush();
        entityManager.clear();

        Session updated = sessionRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals(roomId, updated.getRoomId());
    }

    @Test
    void leaveRoom_ShouldClearRoomIdFromSession() {
        Session created = sessionService.createSession(nickname, avatar);
        Long roomId = 123L;
        sessionService.joinRoom(created.getId(), roomId);

        sessionService.leaveRoom(created.getId());

        Session updated = sessionRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertNull(updated.getRoomId());
    }

    @Test
    void updateSession_WithNewNickname_ShouldUpdate() {
        Session created = sessionService.createSession(nickname, avatar);
        String newNickname = "UpdatedNickname";

        Optional<Session> result = sessionService.updateSession(created.getId(), newNickname, null);

        assertTrue(result.isPresent());
        assertEquals(newNickname, result.get().getNickname());
        assertEquals(avatar, result.get().getAvatar());
    }

    @Test
    void updateSession_WithNewAvatar_ShouldUpdate() {
        Session created = sessionService.createSession(nickname, avatar);
        String newAvatar = "https://example.com/new-avatar.png";

        Optional<Session> result = sessionService.updateSession(created.getId(), null, newAvatar);

        assertTrue(result.isPresent());
        assertEquals(nickname, result.get().getNickname());
        assertEquals(newAvatar, result.get().getAvatar());
    }

    @Test
    void updateSession_WithBothNicknameAndAvatar_ShouldUpdateBoth() {
        Session created = sessionService.createSession(nickname, avatar);
        String newNickname = "NewNickname";
        String newAvatar = "https://example.com/new.png";

        Optional<Session> result = sessionService.updateSession(created.getId(), newNickname, newAvatar);

        assertTrue(result.isPresent());
        assertEquals(newNickname, result.get().getNickname());
        assertEquals(newAvatar, result.get().getAvatar());
    }

    @Test
    void updateSession_WithNullNickname_ShouldNotChange() {
        Session created = sessionService.createSession(nickname, avatar);

        Optional<Session> result = sessionService.updateSession(created.getId(), null, null);

        assertTrue(result.isPresent());
        assertEquals(nickname, result.get().getNickname());
    }

    @Test
    void updateSession_WithEmptyNickname_ShouldNotChange() {
        Session created = sessionService.createSession(nickname, avatar);

        Optional<Session> result = sessionService.updateSession(created.getId(), "", null);

        assertTrue(result.isPresent());
        assertEquals(nickname, result.get().getNickname());
    }

    @Test
    void updateSession_WithNonExistentSession_ShouldReturnEmpty() {
        Optional<Session> result = sessionService.updateSession("nonexistent", "newnick", null);

        assertFalse(result.isPresent());
    }

    @Test
    void getSession_AfterUpdate_ShouldReturnUpdatedData() {
        Session created = sessionService.createSession(nickname, avatar);
        String newNickname = "UpdatedUser";

        sessionService.updateSession(created.getId(), newNickname, null);

        Optional<Session> result = sessionService.getSession(created.getId());

        assertTrue(result.isPresent());
        assertEquals(newNickname, result.get().getNickname());
    }

    @Test
    void createMultipleSessions_ShouldAllBeRetrievable() {
        Session session1 = sessionService.createSession("User1", avatar);
        Session session2 = sessionService.createSession("User2", avatar);
        Session session3 = sessionService.createSession("User3", avatar);

        assertTrue(sessionService.getSession(session1.getId()).isPresent());
        assertTrue(sessionService.getSession(session2.getId()).isPresent());
        assertTrue(sessionService.getSession(session3.getId()).isPresent());

        assertThat(sessionRepository.findAll()).hasSize(3);
    }
}