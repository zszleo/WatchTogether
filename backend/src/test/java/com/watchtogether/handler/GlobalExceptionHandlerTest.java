package com.watchtogether.handler;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.exception.SessionNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleSessionNotFoundException_ShouldReturnUnauthorizedStatus() {
        String errorMessage = "Session not found: abc123";
        SessionNotFoundException exception = new SessionNotFoundException(errorMessage);

        ResponseEntity<ApiResp<Void>> response = handler.handleSessionNotFoundException(exception);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals(errorMessage, response.getBody().getMessage());
    }

    @Test
    void handleSessionNotFoundException_ShouldReturnCorrectApiRespStructure() {
        SessionNotFoundException exception = new SessionNotFoundException("Invalid session ID");

        ResponseEntity<ApiResp<Void>> response = handler.handleSessionNotFoundException(exception);

        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getMessage());
    }

    @Test
    void handleSessionNotFoundException_WithDetailedMessage_ShouldPreserveMessage() {
        String detailedMessage = "Missing required session ID in header: X-Session-Id";
        SessionNotFoundException exception = new SessionNotFoundException(detailedMessage);

        ResponseEntity<ApiResp<Void>> response = handler.handleSessionNotFoundException(exception);

        assertEquals(detailedMessage, response.getBody().getMessage());
    }
}
