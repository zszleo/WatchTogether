package com.watchtogether.resolver;

import com.watchtogether.annotation.CurrentSession;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.model.Session;
import com.watchtogether.service.SessionService;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Optional;

@Component
public class CurrentSessionArgumentResolver implements HandlerMethodArgumentResolver {
    
    private final SessionService sessionService;
    
    public CurrentSessionArgumentResolver(SessionService sessionService) {
        this.sessionService = sessionService;
    }
    
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentSession.class);
    }
    
    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        
        CurrentSession annotation = parameter.getParameterAnnotation(CurrentSession.class);
        boolean required = annotation.required();
        
        String sessionId = webRequest.getHeader("X-Session-Id");
        
        if (required && (sessionId == null || sessionId.trim().isEmpty())) {
            throw new SessionNotFoundException("Missing required session ID in header: X-Session-Id");
        }
        
        if (sessionId == null) {
            return null;
        }
        
        Optional<Session> session = sessionService.getSession(sessionId);
        if (required && !session.isPresent()) {
            throw new SessionNotFoundException("Invalid session ID: " + sessionId);
        }
        
        return session.orElse(null);
    }
}