package com.watchtogether.resolver;

import com.watchtogether.annotation.CurrentSession;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.model.Session;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrentSessionArgumentResolverTest {

    @Mock
    private SessionService sessionService;

    @Mock
    private NativeWebRequest nativeWebRequest;

    @Mock
    private WebDataBinderFactory binderFactory;

    private CurrentSessionArgumentResolver resolver;
    private Method testMethod;
    private MethodParameter methodParameter;

    @BeforeEach
    void setUp() throws NoSuchMethodException {
        resolver = new CurrentSessionArgumentResolver(sessionService);
        
        testMethod = TestController.class.getMethod("testMethod", Session.class);
        methodParameter = new MethodParameter(testMethod, 0);
    }

    @Test
    void supportsParameter_WithCurrentSessionAnnotation_ShouldReturnTrue() {
        assertTrue(resolver.supportsParameter(methodParameter));
    }

    @Test
    void supportsParameter_WithoutAnnotation_ShouldReturnFalse() throws NoSuchMethodException {
        Method otherMethod = TestController.class.getMethod("otherMethod", String.class);
        MethodParameter paramWithoutAnnotation = new MethodParameter(otherMethod, 0);

        assertFalse(resolver.supportsParameter(paramWithoutAnnotation));
    }

    @Test
    void resolveArgument_WithValidSession_ShouldReturnSessionObject() throws Exception {
        String validSessionId = "valid-session-123";
        Session expectedSession = createTestSession(validSessionId);
        
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(validSessionId);
        when(sessionService.getSession(validSessionId)).thenReturn(Optional.of(expectedSession));

        Object result = resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory);

        assertNotNull(result);
        assertTrue(result instanceof Session);
        assertEquals(validSessionId, ((Session) result).getId());
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
        when(sessionService.getSession(invalidSessionId)).thenReturn(Optional.empty());

        assertThrows(SessionNotFoundException.class, () -> 
            resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory));
    }

    @Test
    void resolveArgument_WithOptionalSession_MissingSession_ShouldReturnNull() throws NoSuchMethodException {
        Method optionalMethod = TestController.class.getMethod("optionalMethod", Session.class);
        MethodParameter optionalParam = new MethodParameter(optionalMethod, 0);
        
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(null);

        Object result = resolver.resolveArgument(optionalParam, null, nativeWebRequest, binderFactory);

        assertNull(result);
    }

    @Test
    void resolveArgument_WithOptionalSession_InvalidSession_ShouldReturnNull() throws NoSuchMethodException {
        Method optionalMethod = TestController.class.getMethod("optionalMethod", Session.class);
        MethodParameter optionalParam = new MethodParameter(optionalMethod, 0);
        
        String invalidSessionId = "invalid-session";
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(invalidSessionId);
        when(sessionService.getSession(invalidSessionId)).thenReturn(Optional.empty());

        Object result = resolver.resolveArgument(optionalParam, null, nativeWebRequest, binderFactory);

        assertNull(result);
    }

    @Test
    void resolveArgument_ShouldUseXSessionIdHeader() throws Exception {
        String validSessionId = "session-using-standard-header";
        Session expectedSession = createTestSession(validSessionId);
        
        when(nativeWebRequest.getHeader("X-Session-Id")).thenReturn(validSessionId);
        when(sessionService.getSession(validSessionId)).thenReturn(Optional.of(expectedSession));

        Object result = resolver.resolveArgument(methodParameter, null, nativeWebRequest, binderFactory);

        assertNotNull(result);
        verify(sessionService).getSession(validSessionId);
    }

    private Session createTestSession(String sessionId) {
        Session session = new Session();
        session.setId(sessionId);
        session.setNickname("Test User");
        session.setAvatar("avatar.png");
        session.setIsOnline(true);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        session.setLastSeenAt(LocalDateTime.now());
        return session;
    }

    private static class TestController {
        public void testMethod(@CurrentSession Session session) {}
        
        public void otherMethod(String param) {}
        
        public void optionalMethod(@CurrentSession(required = false) Session session) {}
    }
}
