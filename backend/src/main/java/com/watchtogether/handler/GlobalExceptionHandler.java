package com.watchtogether.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.ValidationErrorResp;
import com.watchtogether.exception.SessionNotFoundException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResp<ValidationErrorResp>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError ? ((FieldError) error).getField() : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ValidationErrorResp errorResp = new ValidationErrorResp();
        errorResp.setFieldErrors(errors);
        
        ApiResp<ValidationErrorResp> response = ApiResp.validationError("Validation failed", errorResp);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResp<Void>> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Invalid JSON request to {}: {}", request.getRequestURI(), ex.getMessage());
        ApiResp<Void> response = ApiResp.error("Invalid JSON format");
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResp<Void>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        logger.warn("Type mismatch for parameter '{}' in {}: expected {}", 
                ex.getName(), request.getRequestURI(), ex.getRequiredType());
        ApiResp<Void> response = ApiResp.error(
                String.format("Invalid value for parameter '%s'", ex.getName()));
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResp<Void>> handleNoHandlerFoundException(
            NoHandlerFoundException ex, HttpServletRequest request) {
        logger.warn("No handler found for {} {}", ex.getHttpMethod(), ex.getRequestURL());
        ApiResp<Void> response = ApiResp.notFound("Resource not found");
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResp<Void>> handleNoResourceFoundException(
            NoResourceFoundException ex, HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        
        // For favicon.ico requests, return 204 No Content instead of 404
        if ("/favicon.ico".equals(requestUri)) {
            logger.debug("Favicon requested but not found: {}", requestUri);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        
        logger.warn("Static resource not found: {} {}", ex.getHttpMethod(), ex.getResourcePath());
        ApiResp<Void> response = ApiResp.notFound("Resource not found");
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResp<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        logger.warn("Illegal argument in {}: {}", request.getRequestURI(), ex.getMessage());
        ApiResp<Void> response = ApiResp.error(ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(SessionNotFoundException.class)
    public ResponseEntity<ApiResp<Void>> handleSessionNotFoundException(SessionNotFoundException ex) {
        return new ResponseEntity<>(ApiResp.unauthorized(ex.getMessage()), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResp<Void>> handleGenericException(
            Exception ex, HttpServletRequest request) {
        logger.error("Unexpected error processing request {} {}", 
                request.getMethod(), request.getRequestURI(), ex);
        ApiResp<Void> response = ApiResp.error("Internal server error");
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}