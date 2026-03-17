package com.watchtogether.interceptor;

import com.watchtogether.annotation.RequireSession;
import com.watchtogether.context.SessionContext;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.method.HandlerMethod;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionValidationInterceptorTest {

    @Mock
    private SessionService sessionService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private SessionValidationInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new SessionValidationInterceptor(sessionService);
        SessionContext.clear();
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
    }

    @Test
    void preHandle_WithValidHandlerMethod_NoAnnotation_ShouldReturnTrue() throws Exception {
        Object handler = createHandlerMethodWithoutAnnotation();

        boolean result = interceptor.preHandle(request, response, handler);

        assertTrue(result);
        verify(sessionService, never()).validateSession(anyString());
    }

    @Test
    void preHandle_WithValidSession_ShouldReturnTrue() throws Exception {
        String validSessionId = "valid-session-123";
        Object handler = createHandlerMethodWithAnnotation();
        
        when(request.getHeader("X-Session-Id")).thenReturn(validSessionId);
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        boolean result = interceptor.preHandle(request, response, handler);

        assertTrue(result);
        assertEquals(validSessionId, SessionContext.getSessionId());
        verify(sessionService).validateSession(validSessionId);
    }

    @Test
    void preHandle_WithMissingSession_ShouldThrowException() throws Exception {
        Object handler = createHandlerMethodWithAnnotation();
        
        when(request.getHeader("X-Session-Id")).thenReturn(null);

        assertThrows(SessionNotFoundException.class, () -> 
            interceptor.preHandle(request, response, handler));
    }

    @Test
    void preHandle_WithEmptySession_ShouldThrowException() throws Exception {
        Object handler = createHandlerMethodWithAnnotation();
        
        when(request.getHeader("X-Session-Id")).thenReturn("   ");

        assertThrows(SessionNotFoundException.class, () -> 
            interceptor.preHandle(request, response, handler));
    }

    @Test
    void preHandle_WithInvalidSession_ShouldThrowException() throws Exception {
        String invalidSessionId = "invalid-session";
        Object handler = createHandlerMethodWithAnnotation();
        
        when(request.getHeader("X-Session-Id")).thenReturn(invalidSessionId);
        when(sessionService.validateSession(invalidSessionId)).thenReturn(false);

        assertThrows(SessionNotFoundException.class, () -> 
            interceptor.preHandle(request, response, handler));
    }

    @Test
    void preHandle_NotHandlerMethod_ShouldReturnTrue() {
        Object handler = new Object();

        boolean result = interceptor.preHandle(request, response, handler);

        assertTrue(result);
        verify(sessionService, never()).validateSession(anyString());
    }

    @Test
    void afterCompletion_ShouldClearSessionContext() throws Exception {
        String validSessionId = "valid-session-123";
        Object handler = createHandlerMethodWithAnnotation();
        
        SessionContext.setSessionId(validSessionId);
        
        interceptor.afterCompletion(request, response, handler, null);

        assertNull(SessionContext.getSessionId());
    }

    @Test
    void afterCompletion_ShouldClearContextEvenOnException() throws Exception {
        String validSessionId = "valid-session-123";
        Object handler = createHandlerMethodWithAnnotation();
        
        SessionContext.setSessionId(validSessionId);
        
        interceptor.afterCompletion(request, response, handler, new RuntimeException("test"));

        assertNull(SessionContext.getSessionId());
    }

    @Test
    void preHandle_ClassLevelAnnotation_ShouldValidateSession() throws Exception {
        String validSessionId = "valid-session-123";
        Object handler = createHandlerMethodWithClassAnnotation();
        
        when(request.getHeader("X-Session-Id")).thenReturn(validSessionId);
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        boolean result = interceptor.preHandle(request, response, handler);

        assertTrue(result);
        assertEquals(validSessionId, SessionContext.getSessionId());
    }

    private HandlerMethod createHandlerMethodWithAnnotation() throws NoSuchMethodException {
        Method method = TestController.class.getMethod("methodWithAnnotation");
        return new HandlerMethod(new TestController(), method);
    }

    private HandlerMethod createHandlerMethodWithoutAnnotation() throws NoSuchMethodException {
        Method method = TestController.class.getMethod("methodWithoutAnnotation");
        return new HandlerMethod(new TestController(), method);
    }

    private HandlerMethod createHandlerMethodWithClassAnnotation() throws NoSuchMethodException {
        Method method = TestControllerWithClass.class.getMethod("someMethod");
        return new HandlerMethod(new TestControllerWithClass(), method);
    }

    private static class TestController {
        @RequireSession
        public void methodWithAnnotation() {}
        
        public void methodWithoutAnnotation() {}
    }

    @RequireSession
    private static class TestControllerWithClass {
        public void someMethod() {}
    }
}
