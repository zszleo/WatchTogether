# WatchTogether后端统一请求头参数获取方案

## 1. 当前问题分析

基于代码审查，发现以下问题：

### 1.1 请求头获取方式不一致
- **RoomController、EmojiController、FileController**：使用`@RequestHeader("X-Session-Id")`直接获取
- **SessionController**：使用路径参数传递sessionId
- **部分方法**：没有显式获取请求头但需要会话验证
- **FileController**：通过HttpServletRequest获取请求头

### 1.2 会话验证重复代码
- 每个控制器方法都重复调用`sessionService.validateSession(sessionId)`
- 错误响应重复构建（401 Unauthorized）
- 缺乏统一的验证逻辑

### 1.3 类型安全性差
- sessionId作为字符串传递，容易出错
- 缺乏编译时检查
- 难以扩展其他请求头参数

### 1.4 扩展性差
- 新增其他请求头参数需要修改每个方法
- 难以统一添加日志、监控等横切关注点
- 代码维护成本高

## 2. 架构设计目标

1. **统一性**：所有请求头参数通过一致方式获取
2. **类型安全**：使用强类型参数和编译时检查
3. **减少重复**：消除会话验证的重复代码
4. **渐进迁移**：支持逐步替换现有代码
5. **易用性**：开发者体验友好，减少样板代码
6. **可扩展**：便于添加新的请求头参数类型

## 3. 技术方案选择

### 3.1 技术栈分析

| 方案 | 适用场景 | 本项目选择 |
|------|----------|------------|
| **HandlerMethodArgumentResolver** | 参数级别注入，类型安全 | ✅ **首选** |
| **自定义注解** | 声明式配置，简洁优雅 | ✅ **首选** |
| **拦截器** | 全局预处理，统一验证 | ✅ **辅助使用** |
| **切面** | 横切关注点，复杂逻辑 | ⚠️ 过度设计 |
| **过滤器** | 请求预处理，性能影响 | ⚠️ 过早优化 |

### 3.2 核心方案：参数解析器 + 自定义注解

**优点**：
- Spring原生支持，集成简单
- 类型安全，编译时检查
- 声明式编程，代码简洁
- 支持复杂类型注入（如Session对象）
- 可与其他Spring组件（如验证器）集成

## 4. 详细实现方案

### 4.1 目录结构设计

```
src/main/java/com/watchtogether/
├── annotation/           # 自定义注解
│   ├── SessionId.java
│   ├── CurrentSession.java
│   └── RequireSession.java
├── resolver/            # 参数解析器
│   ├── SessionIdArgumentResolver.java
│   └── CurrentSessionArgumentResolver.java
├── interceptor/         # 拦截器
│   └── SessionValidationInterceptor.java
├── config/              # 配置类
│   └── WebMvcConfig.java
├── context/             # 上下文
│   └── SessionContext.java
└── exception/           # 自定义异常
    └── SessionNotFoundException.java
```

### 4.2 自定义注解实现

#### 4.2.1 @SessionId - 从请求头获取sessionId
```java
package com.watchtogether.annotation;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface SessionId {
    boolean required() default true;
    String headerName() default "X-Session-Id";
}
```

#### 4.2.2 @CurrentSession - 直接获取Session对象
```java
package com.watchtogether.annotation;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentSession {
    boolean required() default true;
}
```

#### 4.2.3 @RequireSession - 方法级会话验证注解
```java
package com.watchtogether.annotation;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireSession {
    boolean validate() default true;
}
```

### 4.3 参数解析器实现

#### 4.3.1 SessionIdArgumentResolver.java
```java
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
        
        if (sessionId != null && !sessionService.validateSession(sessionId)) {
            throw new SessionNotFoundException("Invalid session ID: " + sessionId);
        }
        
        return sessionId;
    }
}
```

#### 4.3.2 CurrentSessionArgumentResolver.java
```java
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
```

### 4.4 会话上下文（线程安全）

#### 4.4.1 SessionContext.java
```java
package com.watchtogether.context;

import com.watchtogether.model.Session;

public class SessionContext {
    private static final ThreadLocal<String> currentSessionId = new ThreadLocal<>();
    private static final ThreadLocal<Session> currentSession = new ThreadLocal<>();
    
    public static void setSessionId(String sessionId) {
        currentSessionId.set(sessionId);
    }
    
    public static String getSessionId() {
        return currentSessionId.get();
    }
    
    public static void setSession(Session session) {
        currentSession.set(session);
    }
    
    public static Session getSession() {
        return currentSession.get();
    }
    
    public static void clear() {
        currentSessionId.remove();
        currentSession.remove();
    }
}
```

### 4.5 拦截器（可选，用于全局验证）

#### 4.5.1 SessionValidationInterceptor.java
```java
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
```

### 4.6 配置类

#### 4.6.1 WebMvcConfig.java
```java
package com.watchtogether.config;

import com.watchtogether.interceptor.SessionValidationInterceptor;
import com.watchtogether.resolver.CurrentSessionArgumentResolver;
import com.watchtogether.resolver.SessionIdArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
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
                .excludePathPatterns("/api/sessions", "/api/health", "/api/sessions/{sessionId}/validate");
    }
}
```

### 4.7 自定义异常

#### 4.7.1 SessionNotFoundException.java
```java
package com.watchtogether.exception;

public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException(String message) {
        super(message);
    }
}
```

### 4.8 增强全局异常处理器

在现有的`GlobalExceptionHandler`中添加：
```java
package com.watchtogether.handler;

import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.exception.SessionNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 其他异常处理...
    
    @ExceptionHandler(SessionNotFoundException.class)
    public ResponseEntity<ApiResp<Void>> handleSessionNotFoundException(SessionNotFoundException ex) {
        return new ResponseEntity<>(ApiResp.unauthorized(ex.getMessage()), HttpStatus.UNAUTHORIZED);
    }
}
```

## 5. 使用示例

### 5.1 原始代码（改造前）
```java
@PostMapping
public ResponseEntity<ApiResp<RoomResp>> createRoom(
        @Valid @RequestBody CreateRoomReq request,
        @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
    
    if (sessionId == null || !sessionService.validateSession(sessionId)) {
        return new ResponseEntity<>(ApiResp.unauthorized("Valid session ID required"), HttpStatus.UNAUTHORIZED);
    }
    
    Room room = roomService.createRoom(request, sessionId);
    // ...
}
```

### 5.2 新方案使用方式

#### 方式1：直接获取sessionId（推荐）
```java
@PostMapping
@RequireSession  // 可选，方法级验证
public ResponseEntity<ApiResp<RoomResp>> createRoom(
        @Valid @RequestBody CreateRoomReq request,
        @SessionId String sessionId) {  // 自动验证并注入
    
    Room room = roomService.createRoom(request, sessionId);
    return ResponseEntity.ok(ApiResp.success(room.toResp()));
}
```

#### 方式2：直接获取Session对象
```java
@PostMapping
public ResponseEntity<ApiResp<RoomResp>> createRoom(
        @Valid @RequestBody CreateRoomReq request,
        @CurrentSession Session session) {  // 自动查询并注入Session对象
    
    Room room = roomService.createRoom(request, session.getId());
    return ResponseEntity.ok(ApiResp.success(room.toResp()));
}
```

#### 方式3：混合使用
```java
@GetMapping("/user")
@RequireSession
public ResponseEntity<ApiResp<List<Emoji>>> getUserEmojis(
        @CurrentSession Session session) {  // 方法已验证，直接获取Session
    
    List<Emoji> emojis = emojiService.getUserEmojis(session.getId());
    return ResponseEntity.ok(ApiResp.success(emojis));
}
```

#### 方式4：获取可选的sessionId
```java
@GetMapping("/{roomId}")
public ResponseEntity<ApiResp<RoomResp>> getRoom(
        @PathVariable Long roomId,
        @SessionId(required = false) String sessionId) {  // 可选参数
    
    // 逻辑保持不变，sessionId可能为null
    Room room = roomService.getRoom(roomId, sessionId);
    return ResponseEntity.ok(ApiResp.success(room.toResp()));
}
```

## 6. 迁移策略

### 阶段1：基础框架搭建（1-2天）
1. 创建所有基础组件（注解、解析器、异常）
2. 配置WebMvcConfig
3. 更新GlobalExceptionHandler
4. 编写单元测试

### 阶段2：逐步替换（按优先级）
**优先级顺序**：
1. 新建的控制器方法（直接使用新方案）
2. 高复杂度方法（重复验证代码多的）
3. 公开API方法（影响面小的）
4. 核心业务方法

**迁移示例**：
```java
// 原代码保持不动，新增使用新注解
@PostMapping("/new-endpoint")
public ResponseEntity<ApiResp<Something>> newEndpoint(
        @Valid @RequestBody SomeReq request,
        @SessionId String sessionId) {
    // 使用新方案
}
```

### 阶段3：全面替换与测试
1. 逐个控制器替换
2. 每次替换后运行测试
3. 更新API文档（Swagger）

### 阶段4：清理与优化
1. 删除不再使用的`@RequestHeader("X-Session-Id")`
2. 移除重复的验证代码
3. 性能测试与优化

## 7. 兼容性考虑

### 7.1 向后兼容
- 保持`@RequestHeader("X-Session-Id")`继续工作
- 新旧方案可共存，逐步迁移
- 不修改现有API接口契约

### 7.2 Swagger文档支持
在注解中添加Swagger元数据：
```java
@SessionId
@Parameter(description = "用户会话ID", example = "sess_abc123def456", 
           required = true, in = ParameterIn.HEADER)
String sessionId
```

或创建专门的Swagger注解：
```java
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Parameter(description = "用户会话ID", example = "sess_abc123def456", 
           required = true, in = ParameterIn.HEADER)
public @interface ApiSessionId {
    boolean required() default true;
}
```

## 8. 扩展性设计

### 8.1 支持其他请求头
```java
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequestHeaderParam {
    String value();
    boolean required() default true;
    String defaultValue() default "";
}

// 使用示例
public ResponseEntity<?> someMethod(
        @RequestHeaderParam("X-Client-Version") String clientVersion,
        @RequestHeaderParam("X-Device-Type") String deviceType) {
    // ...
}
```

### 8.2 权限控制扩展
```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String[] value();
    Logical logical() default Logical.AND;
}

// 解析器可检查用户权限
```

### 8.3 缓存优化
```java
@Component
public class CachedSessionArgumentResolver extends CurrentSessionArgumentResolver {
    
    private final Cache<String, Optional<Session>> sessionCache;
    
    @Override
    public Object resolveArgument(...) {
        String sessionId = // 获取sessionId
        
        return sessionCache.get(sessionId, () -> {
            return sessionService.getSession(sessionId);
        }).orElse(null);
    }
}
```

## 9. 性能影响评估

### 9.1 优势
- **减少重复查询**：Session对象可缓存，避免多次数据库查询
- **减少代码执行**：消除重复验证逻辑
- **内存优化**：ThreadLocal避免参数传递

### 9.2 潜在开销
- **反射开销**：参数解析器使用反射，但Spring已优化
- **拦截器链**：新增拦截器增加调用链深度

### 9.3 优化建议
1. 使用缓存减少数据库查询
2. 避免在解析器中执行复杂业务逻辑
3. 考虑使用`@Lazy`注解延迟加载Session对象

## 10. 测试策略

### 10.1 单元测试
```java
@WebMvcTest
@Import({SessionIdArgumentResolver.class, CurrentSessionArgumentResolver.class})
class SessionArgumentResolverTest {
    
    @Test
    void shouldResolveSessionIdFromHeader() {
        // 测试参数解析
    }
    
    @Test
    void shouldThrowExceptionWhenSessionIdMissing() {
        // 测试异常情况
    }
}
```

### 10.2 集成测试
```java
@SpringBootTest
@AutoConfigureMockMvc
class SessionIntegrationTest {
    
    @Test
    void shouldAccessProtectedEndpointWithValidSession() {
        mockMvc.perform(post("/api/rooms")
                .header("X-Session-Id", validSessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isCreated());
    }
}
```

### 10.3 兼容性测试
确保新旧代码共存时功能正常。

## 11. 总结

### 11.1 方案优势
1. **统一性**：所有请求头参数通过一致方式获取
2. **类型安全**：编译时检查，减少运行时错误
3. **减少重复**：消除70%以上的验证样板代码
4. **易于维护**：集中管理会话验证逻辑
5. **渐进迁移**：支持逐步替换，降低风险

### 11.2 风险评估与缓解
| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 性能下降 | 低 | 使用缓存，避免重复查询 |
| 兼容性问题 | 中 | 新旧方案共存，逐步迁移 |
| 学习成本 | 低 | 提供详细文档和示例 |
| 框架升级兼容性 | 低 | 使用Spring标准API |

### 11.3 实施建议
1. **先试点后推广**：先在1-2个控制器试点
2. **充分测试**：确保100%测试覆盖率
3. **监控观察**：上线后监控性能指标
4. **团队培训**：分享最佳实践和使用示例

---

**文档版本**: 1.0  
**创建日期**: 2026-03-06  
**最后更新**: 2026-03-06  
**适用版本**: Spring Boot 3.2.0+