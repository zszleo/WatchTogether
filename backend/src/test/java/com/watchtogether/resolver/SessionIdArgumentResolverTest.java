package com.watchtogether.resolver;

import com.watchtogether.annotation.SessionId;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.ServletWebRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionIdArgumentResolverTest {

    @Mock
    private SessionService sessionService;

    @Mock
    private NativeWebRequest nativeWebRequest;

    @Mock
    private HttpServletRequest servletRequest;

    @Mock
    private WebDataBinderFactory binderFactory;

    private SessionIdArgumentResolver resolver;
    private Method testMethod;
    private MethodParameter methodParameter;

    @BeforeEach
    void setUp() throws NoSuchMethodException {
        resolver = new SessionIdArgumentResolver(sessionService);
        
        testMethod = TestController.class.getMethod("testMethod", String.class);
        methodParameter = new MethodParameter(testMethod, 0);
    }

    @Test
    void supportsParameter_WithSessionIdAnnotation_ShouldReturnTrue() {
        assertTrue(resolver.supportsParameter(methodParameter));
    }

    @Test
    void supportsParameter_WithoutAnnotation_ShouldReturnFalse() throws NoSuchMethodException {
        Method otherMethod = TestController.class.getMethod("otherMethod", String.class);
        MethodParameter paramWithoutAnnotation = new MethodParameter(otherMethod, 0);

        assertFalse(resolver.supportsParameter(paramWithoutAnnotation));
    }

    @Test
    void resolveArgument_WithValidSession_ShouldReturnSessionId() throws Exception {
        String validSessionId = "valid-session-123";
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(validSessionId);
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        Object result = resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory);

        assertEquals(validSessionId, result);
        verify(sessionService).validateSession(validSessionId);
    }

    @Test
    void resolveArgument_WithMissingRequiredSession_ShouldThrowException() {
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(null);

        assertThrows(SessionNotFoundException.class, () -> 
            resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory));
    }

    @Test
    void resolveArgument_WithEmptyRequiredSession_ShouldThrowException() {
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn("   ");

        assertThrows(SessionNotFoundException.class, () -> 
            resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory));
    }

    @Test
    void resolveArgument_WithInvalidSession_ShouldThrowException() {
        String invalidSessionId = "invalid-session";
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(invalidSessionId);
        when(sessionService.validateSession(invalidSessionId)).thenReturn(false);

        assertThrows(SessionNotFoundException.class, () -> 
            resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory));
    }

    @Test
    void resolveArgument_WithOptionalSession_MissingSession_ShouldReturnNull() throws NoSuchMethodException {
        Method optionalMethod = TestController.class.getMethod("optionalMethod", String.class);
        MethodParameter optionalParam = new MethodParameter(optionalMethod, 0);
        
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(null);

        Object result = resolver.resolveArgument(optionalParam, null, nativeWebRequest, binderFactory);

        assertNull(result);
    }

    @Test
    void resolveArgument_WithOptionalSession_InvalidSession_ShouldReturnNull() throws NoSuchMethodException {
        Method optionalMethod = TestController.class.getMethod("optionalMethod", String.class);
        MethodParameter optionalParam = new MethodParameter(optionalMethod, 0);
        
        String invalidSessionId = "invalid-session";
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(invalidSessionId);
        when(sessionService.validateSession(invalidSessionId)).thenReturn(false);

        Object result = resolver.resolveArgument(optionalParam, null, nativeWebRequest, binderFactory);

        assertNull(result);
    }

    @Test
    void resolveArgument_WithCustomHeaderName() throws NoSuchMethodException {
        Method customHeaderMethod = TestController.class.getMethod("customHeaderMethod", String.class);
        MethodParameter customParam = new MethodParameter(customHeaderMethod, 0);
        
        String customSessionId = "custom-session";
        when(nativeWebRequest.getHeader("X-Custom-Session")).thenReturn(customSessionId);
        when(sessionService.validateSession(customSessionId)).thenReturn(true);

        Object result = resolver.resolveArgument(customParam, null, nativeWebRequest, binderFactory);

        assertEquals(customSessionId, result);
    }

    @Test
    void resolveArgument_WithValidSession_TrimsWhitespace() throws Exception {
        String sessionIdWithSpaces = "  valid-session-123  ";
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(sessionIdWithSpaces);
        when(sessionService.validateSession(sessionIdWithSpaces)).thenReturn(true);

        Object result = resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory);

        assertEquals(sessionIdWithSpaces, result);
    }

    private static class TestController {
        public void testMethod(@SessionId String sessionId) {}
        
        public void otherMethod(String param) {}
        
        public void optionalMethod(@SessionId(required = false) String sessionId) {}
        
        public void customHeaderMethod(@SessionId(headerName = "X-Custom-Session") String sessionId) {}
    }
}
