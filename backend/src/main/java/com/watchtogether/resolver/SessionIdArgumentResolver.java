package com.watchtogether.resolver;

import com.watchtogether.annotation.SessionId;
import com.watchtogether.exception.SessionNotFoundException;
import com.watchtogether.service.SessionService;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class SessionIdArgumentResolver implements HandlerMethodArgumentResolver {
    
    private final SessionService sessionService;
    
    public SessionIdArgumentResolver(SessionService sessionService) {
        this.sessionService = sessionService;
    }
    
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(SessionId.class);
    }
    
    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        
        SessionId annotation = parameter.getParameterAnnotation(SessionId.class);
        String headerName = annotation.headerName();
        boolean required = annotation.required();
        
        String sessionId = webRequest.getHeader(headerName);
        
        if (required && (sessionId == null || sessionId.trim().isEmpty())) {
            throw new SessionNotFoundException("Missing required session ID in header: " + headerName);
        }
        
        if (sessionId != null) {
            if (!sessionService.validateSession(sessionId)) {
                if (required) {
                    throw new SessionNotFoundException("Invalid session ID: " + sessionId);
                } else {
                    // For optional parameters, treat invalid sessionId as not provided
                    return null;
                }
            }
        }
        
        return sessionId;
    }
}