package com.watchtogether.handler;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.ValidationErrorResp;
import com.watchtogether.exception.SessionNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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

    @Test
    void handleValidationExceptions_ShouldReturnBadRequestStatus() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "object");
        bindingResult.addError(new FieldError("object", "name", "Name is required"));

        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResp<ValidationErrorResp>> response = handler.handleValidationExceptions(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Validation failed", response.getBody().getMessage());
    }

    @Test
    void handleValidationExceptions_ShouldReturnFieldErrors() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "object");
        bindingResult.addError(new FieldError("object", "name", "Name is required"));
        bindingResult.addError(new FieldError("object", "email", "Email is invalid"));

        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResp<ValidationErrorResp>> response = handler.handleValidationExceptions(exception);

        ValidationErrorResp validationErrors = response.getBody().getData();
        assertNotNull(validationErrors);
        assertNotNull(validationErrors.getFieldErrors());
        assertEquals(2, validationErrors.getFieldErrors().size());
        assertEquals("Name is required", validationErrors.getFieldErrors().get("name"));
        assertEquals("Email is invalid", validationErrors.getFieldErrors().get("email"));
    }

    @Test
    void handleValidationExceptions_WithNonFieldError_ShouldUseObjectName() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "myObject");
        bindingResult.addError(new org.springframework.validation.ObjectError("myObject", "Object error"));

        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResp<ValidationErrorResp>> response = handler.handleValidationExceptions(exception);

        ValidationErrorResp validationErrors = response.getBody().getData();
        assertNotNull(validationErrors);
        assertTrue(validationErrors.getFieldErrors().containsKey("myObject"));
        assertEquals("Object error", validationErrors.getFieldErrors().get("myObject"));
    }

    @Test
    void handleValidationExceptions_WithMultipleErrors_ShouldIncludeAll() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "form");
        bindingResult.addError(new FieldError("form", "username", "Username too short"));
        bindingResult.addError(new FieldError("form", "email", "Invalid email"));
        bindingResult.addError(new FieldError("form", "password", "Password required"));

        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResp<ValidationErrorResp>> response = handler.handleValidationExceptions(exception);

        ValidationErrorResp validationErrors = response.getBody().getData();
        assertEquals(3, validationErrors.getFieldErrors().size());
        assertEquals("Username too short", validationErrors.getFieldErrors().get("username"));
        assertEquals("Invalid email", validationErrors.getFieldErrors().get("email"));
        assertEquals("Password required", validationErrors.getFieldErrors().get("password"));
    }

    @Test
    void handleHttpMessageNotReadableException_ShouldReturnBadRequestStatus() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");

        HttpMessageNotReadableException exception = new HttpMessageNotReadableException("Invalid JSON");

        ResponseEntity<ApiResp<Void>> response = handler.handleHttpMessageNotReadableException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid JSON format", response.getBody().getMessage());
    }

    @Test
    void handleHttpMessageNotReadableException_WithDifferentUri_ShouldStillReturnBadRequest() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/room/create");

        HttpMessageNotReadableException exception = new HttpMessageNotReadableException("Malformed JSON");

        ResponseEntity<ApiResp<Void>> response = handler.handleHttpMessageNotReadableException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleMethodArgumentTypeMismatchException_ShouldReturnBadRequestStatus() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/room/abc");

        MethodArgumentTypeMismatchException exception = mock(MethodArgumentTypeMismatchException.class);
        when(exception.getName()).thenReturn("roomId");
        when(exception.getRequiredType()).thenReturn(null);

        ResponseEntity<ApiResp<Void>> response = handler.handleMethodArgumentTypeMismatchException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("roomId"));
    }

    @Test
    void handleMethodArgumentTypeMismatchException_ShouldIncludeParameterName() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/user/xyz");

        MethodArgumentTypeMismatchException exception = mock(MethodArgumentTypeMismatchException.class);
        when(exception.getName()).thenReturn("userId");
        when(exception.getRequiredType()).thenReturn(null);

        ResponseEntity<ApiResp<Void>> response = handler.handleMethodArgumentTypeMismatchException(exception, request);

        assertEquals("Invalid value for parameter 'userId'", response.getBody().getMessage());
    }

    @Test
    void handleMethodArgumentTypeMismatchException_WithIntegerType_ShouldReturnBadRequest() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/item/abc");

        MethodArgumentTypeMismatchException exception = mock(MethodArgumentTypeMismatchException.class);
        when(exception.getName()).thenReturn("id");
        when(exception.getRequiredType()).thenReturn(null);

        ResponseEntity<ApiResp<Void>> response = handler.handleMethodArgumentTypeMismatchException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleNoHandlerFoundException_ShouldReturnNotFoundStatus() throws Exception {
        NoHandlerFoundException exception = new NoHandlerFoundException("GET", "/nonexistent", null);

        ResponseEntity<ApiResp<Void>> response = handler.handleNoHandlerFoundException(exception, mock(HttpServletRequest.class));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Resource not found", response.getBody().getMessage());
    }

    @Test
    void handleNoHandlerFoundException_WithDifferentMethod_ShouldReturnNotFound() throws Exception {
        NoHandlerFoundException exception = new NoHandlerFoundException("POST", "/api/unknown", null);

        ResponseEntity<ApiResp<Void>> response = handler.handleNoHandlerFoundException(exception, mock(HttpServletRequest.class));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void handleNoResourceFoundException_ShouldReturnNotFoundStatus() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/static/missing.js");

        NoResourceFoundException exception = new NoResourceFoundException(HttpMethod.GET, "/static/missing.js");

        ResponseEntity<ApiResp<Void>> response = handler.handleNoResourceFoundException(exception, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Resource not found", response.getBody().getMessage());
    }

    @Test
    void handleNoResourceFoundException_FaviconIco_ShouldReturnNoContent() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/favicon.ico");

        NoResourceFoundException exception = new NoResourceFoundException(HttpMethod.GET, "/favicon.ico");

        ResponseEntity<ApiResp<Void>> response = handler.handleNoResourceFoundException(exception, request);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void handleNoResourceFoundException_NonFavicon_ShouldReturnNotFound() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/static/style.css");

        NoResourceFoundException exception = new NoResourceFoundException(HttpMethod.GET, "/static/style.css");

        ResponseEntity<ApiResp<Void>> response = handler.handleNoResourceFoundException(exception, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void handleIllegalArgumentException_ShouldReturnBadRequestStatus() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");

        IllegalArgumentException exception = new IllegalArgumentException("Invalid input");

        ResponseEntity<ApiResp<Void>> response = handler.handleIllegalArgumentException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid input", response.getBody().getMessage());
    }

    @Test
    void handleIllegalArgumentException_ShouldPreserveExceptionMessage() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/file");

        IllegalArgumentException exception = new IllegalArgumentException("Invalid file ID format");

        ResponseEntity<ApiResp<Void>> response = handler.handleIllegalArgumentException(exception, request);

        assertEquals("Invalid file ID format", response.getBody().getMessage());
    }

    @Test
    void handleIllegalArgumentException_WithNullMessage_ShouldReturnNull() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");

        IllegalArgumentException exception = new IllegalArgumentException((String) null);

        ResponseEntity<ApiResp<Void>> response = handler.handleIllegalArgumentException(exception, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleGenericException_ShouldReturnInternalServerErrorStatus() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/test");

        Exception exception = new RuntimeException("Unexpected error");

        ResponseEntity<ApiResp<Void>> response = handler.handleGenericException(exception, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Internal server error", response.getBody().getMessage());
    }

    @Test
    void handleGenericException_WithDifferentHttpMethod_ShouldStillReturn500() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/room");

        Exception exception = new RuntimeException("Database connection failed");

        ResponseEntity<ApiResp<Void>> response = handler.handleGenericException(exception, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Internal server error", response.getBody().getMessage());
    }

    @Test
    void handleGenericException_ShouldNotExposeInternalDetails() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn("DELETE");
        when(request.getRequestURI()).thenReturn("/api/resource");

        Exception exception = new RuntimeException("Internal secret: password123");

        ResponseEntity<ApiResp<Void>> response = handler.handleGenericException(exception, request);

        assertEquals("Internal server error", response.getBody().getMessage());
        assertNotEquals("Internal secret: password123", response.getBody().getMessage());
    }

    @Test
    void handleGenericException_WithNullException_ShouldReturn500() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/test");

        Exception exception = new RuntimeException();

        ResponseEntity<ApiResp<Void>> response = handler.handleGenericException(exception, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void handleHttpMessageNotReadableException_ShouldLogWarning() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/room");

        HttpMessageNotReadableException exception = new HttpMessageNotReadableException("JSON parse error");

        ResponseEntity<ApiResp<Void>> response = handler.handleHttpMessageNotReadableException(exception, request);

        assertNotNull(response.getBody());
    }
}
