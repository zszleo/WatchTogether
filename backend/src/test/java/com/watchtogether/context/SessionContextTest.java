package com.watchtogether.context;

import com.watchtogether.model.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class SessionContextTest {

    @BeforeEach
    void setUp() {
        SessionContext.clear();
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
    }

    @Test
    void setSessionId_ShouldStoreSessionId() {
        String sessionId = "test-session-123";

        SessionContext.setSessionId(sessionId);

        assertEquals(sessionId, SessionContext.getSessionId());
    }

    @Test
    void getSessionId_WhenNotSet_ShouldReturnNull() {
        assertNull(SessionContext.getSessionId());
    }

    @Test
    void setSession_ShouldStoreSession() {
        Session session = createTestSession();

        SessionContext.setSession(session);

        assertEquals(session, SessionContext.getSession());
    }

    @Test
    void getSession_WhenNotSet_ShouldReturnNull() {
        assertNull(SessionContext.getSession());
    }

    @Test
    void clear_ShouldRemoveAllValues() {
        SessionContext.setSessionId("test-session");
        SessionContext.setSession(createTestSession());

        SessionContext.clear();

        assertNull(SessionContext.getSessionId());
        assertNull(SessionContext.getSession());
    }

    @Test
    void shouldSupportMultipleSetOperations() {
        String sessionId1 = "session-1";
        String sessionId2 = "session-2";

        SessionContext.setSessionId(sessionId1);
        assertEquals(sessionId1, SessionContext.getSessionId());

        SessionContext.setSessionId(sessionId2);
        assertEquals(sessionId2, SessionContext.getSessionId());
    }

    @Test
    void shouldHandleEmptyStringSessionId() {
        SessionContext.setSessionId("");

        assertEquals("", SessionContext.getSessionId());
    }

    private Session createTestSession() {
        Session session = new Session();
        session.setId("test-session-123");
        session.setNickname("Test User");
        session.setAvatar("avatar.png");
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        session.setLastSeenAt(LocalDateTime.now());
        return session;
    }
}
