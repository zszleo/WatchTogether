package com.watchtogether.interceptor;

import com.watchtogether.annotation.RequireSession;
import com.watchtogether.context.SessionContext;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SessionValidationInterceptor implements HandlerInterceptor {
    
    private final SessionService sessionService;
    
    public SessionValidationInterceptor(SessionService sessionService) {
        this.sessionService = sessionService;
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        
        // 检查方法或类是否有@RequireSession注解
        boolean requiresSession = handlerMethod.hasMethodAnnotation(RequireSession.class) ||
                                 handlerMethod.getBeanType().isAnnotationPresent(RequireSession.class);
        
        if (!requiresSession) {
            return true;
        }
        
        String sessionId = request.getHeader("X-Session-Id");
        if (sessionId == null || sessionId.trim().isEmpty()) {
            throw new SessionNotFoundException("Missing required session ID in header: X-Session-Id");
        }
        
        if (!sessionService.validateSession(sessionId)) {
            throw new SessionNotFoundException("Invalid session ID: " + sessionId);
        }
        
        // 设置到上下文
        SessionContext.setSessionId(sessionId);
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                Object handler, Exception ex) {
        SessionContext.clear();
    }
}