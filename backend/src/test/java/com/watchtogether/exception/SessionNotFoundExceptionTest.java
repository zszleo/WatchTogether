package com.watchtogether.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SessionNotFoundExceptionTest {

    @Test
    void constructor_WithMessage_ShouldStoreMessage() {
        String expectedMessage = "Session not found";

        SessionNotFoundException exception = new SessionNotFoundException(expectedMessage);

        assertEquals(expectedMessage, exception.getMessage());
    }

    @Test
    void constructor_WithNullMessage_ShouldStoreNull() {
        SessionNotFoundException exception = new SessionNotFoundException(null);

        assertNull(exception.getMessage());
    }

    @Test
    void shouldBeRuntimeException() {
        SessionNotFoundException exception = new SessionNotFoundException("test");

        assertTrue(exception instanceof RuntimeException);
    }

    @Test
    void shouldStoreDetailedMessage() {
        String detailedMessage = "Invalid session ID: abc123";

        SessionNotFoundException exception = new SessionNotFoundException(detailedMessage);

        assertTrue(exception.getMessage().contains("abc123"));
    }
}
