package com.watchtogether.config;

import com.watchtogether.interceptor.SessionValidationInterceptor;
import com.watchtogether.resolver.CurrentSessionArgumentResolver;
import com.watchtogether.resolver.SessionIdArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    private final SessionIdArgumentResolver sessionIdArgumentResolver;
    private final CurrentSessionArgumentResolver currentSessionArgumentResolver;
    private final SessionValidationInterceptor sessionValidationInterceptor;
    
    public WebMvcConfig(SessionIdArgumentResolver sessionIdArgumentResolver,
                       CurrentSessionArgumentResolver currentSessionArgumentResolver,
                       SessionValidationInterceptor sessionValidationInterceptor) {
        this.sessionIdArgumentResolver = sessionIdArgumentResolver;
        this.currentSessionArgumentResolver = currentSessionArgumentResolver;
        this.sessionValidationInterceptor = sessionValidationInterceptor;
    }
    
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(sessionIdArgumentResolver);
        resolvers.add(currentSessionArgumentResolver);
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessionValidationInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/session", "/api/health", "/api/session/{sessionId}/validate");
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:28080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}