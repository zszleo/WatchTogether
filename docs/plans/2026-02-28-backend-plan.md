# WatchTogether 后端实施计划

> **For Claude:** Use superpowers:executing-plans to implement this plan.

**Goal:** 构建 Spring Boot 后端应用，提供 REST API 和 Socket.io 实时通信

**Architecture:** Spring Boot 3.x + netty-socketio + MySQL + Redis

**Tech Stack:** Spring Boot 3.x, Spring Data JPA, MySQL, Redis, netty-socketio

---

## Phase 1: 基础设施

### Task 1: Spring Boot 项目初始化

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/watchtogether/WatchTogetherApplication.java`

**Step 1: 创建 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <groupId>com.watchtogether</groupId>
    <artifactId>watchtogether</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- WebSocket (netty-socketio) -->
        <dependency>
            <groupId>com.corundumstudio.socketio</groupId>
            <artifactId>netty-socketio</artifactId>
            <version>2.0.11</version>
        </dependency>
        
        <!-- Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- MySQL -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Jackson for JSON -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        
        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**Step 2: 创建 application.yml**

```yaml
server:
  port: 18080

spring:
  application:
    name: watchtogether
  
  datasource:
    url: jdbc:mysql://localhost:3306/watchtogether?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
  
  data:
    redis:
      host: localhost
      port: 6379
      database: 0

# File upload
file:
  upload-dir: ./uploads
  max-size: 104857600  # 100MB

# Socket.io
socketio:
  host: 0.0.0.0
  port: 19090
  pingTimeout: 60000
  pingInterval: 25000
```

**Step 3: 创建主类**

```java
package com.watchtogether;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WatchTogetherApplication {
    public static void main(String[] args) {
        SpringApplication.run(WatchTogetherApplication.class, args);
    }
}
```

**Step 4: 创建目录结构**

```bash
mkdir -p backend/src/main/java/com/watchtogether/{controller,service,repository,model,dto,config,handler}
mkdir -p backend/src/main/resources
```

**Step 5: Commit**

```bash
cd backend
git init
git add .
git commit -m "feat: initialize Spring Boot project"
```

---

### Task 2: Redis 配置

**Files:**
- Create: `backend/src/main/java/com/watchtogether/config/RedisConfig.java`
- Create: `backend/src/main/java/com/watchtogether/config/RedisTemplateConfig.java`

**Step 1: Redis 配置**

```java
package com.watchtogether.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    
    @Value("${spring.data.redis.host}")
    private String redisHost;
    
    @Value("${spring.data.redis.port}")
    private int redisPort;
    
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(redisHost, redisPort);
        return new LettuceConnectionFactory(config);
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Key 使用 String 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value 使用 JSON 序列化
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }
}
```

**Step 2: Commit**

```bash
git add src/main/java/com/watchtogether/config/
git commit -m "feat: add Redis configuration"
```

---

### Task 3: Socket.io 配置

**Files:**
- Create: `backend/src/main/java/com/watchtogether/config/SocketIOConfig.java`

**Step 1: Socket.io 配置**

```java
package com.watchtogether.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {
    
    @Value("${socketio.host}")
    private String host;
    
    @Value("${socketio.port}")
    private int port;
    
    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setPingTimeout(60000);
        config.setPingInterval(25000);
        
        SocketIOServer server = new SocketIOServer(config);
        return server;
    }
    
    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketIOServer) {
        return new SpringAnnotationScanner(socketIOServer);
    }
}
```

**Step 2: 添加启动类注解**

```java
package com.watchtogether;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WatchTogetherApplication {
    public static void main(String[] args) {
        SpringApplication.run(WatchTogetherApplication.class, args);
    }
}
```

**Step 3: Commit**

```bash
git commit -m "feat: add Socket.io configuration"
```

---

### Task 4: 统一响应和异常处理

**Files:**
- Create: `backend/src/main/java/com/watchtogether/dto/ApiResponse.java`
- Create: `backend/src/main/java/com/watchtogether/config/GlobalExceptionHandler.java`

**Step 1: 统一响应**

```java
package com.watchtogether.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }
    
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(200, "success", null);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(500, message, null);
    }
    
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

**Step 2: 异常处理**

```java
package com.watchtogether.config;

import com.watchtogether.dto.ApiResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        e.printStackTrace();
        return ApiResponse.error(e.getMessage());
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.error(400, e.getMessage());
    }
}
```

**Step 3: Commit**

```bash
git add src/main/java/com/watchtogether/dto/
git commit -m "feat: add unified API response and exception handling"
```

---

## Phase 2: 核心功能

### Task 5: 数据模型

**Files:**
- Create: `backend/src/main/java/com/watchtogether/model/Room.java`
- Create: `backend/src/main/java/com/watchtogether/model/Session.java`
- Create: `backend/src/main/java/com/watchtogether/model/ChatMessage.java`

**Step 1: Room 实体**

```java
package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @Column(length = 6)
    private String id;
    
    @Column(length = 100)
    private String name;
    
    @Column(name = "max_users")
    private Integer maxUsers = 5;
    
    @Column(name = "is_public")
    private Boolean isPublic = true;
    
    @Column(name = "creator_session_id", length = 50)
    private String creatorSessionId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Step 2: Session 实体**

```java
package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sessions")
public class Session {
    @Id
    @Column(length = 50)
    private String id;
    
    @Column(length = 50)
    private String nickname;
    
    @Column(length = 100)
    private String avatar = "avatar1.png";
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActiveAt = LocalDateTime.now();
    }
}
```

**Step 3: ChatMessage 实体**

```java
package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "room_id", length = 6, nullable = false)
    private String roomId;
    
    @Column(name = "session_id", length = 50, nullable = false)
    private String sessionId;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "message_type")
    @Enumerated(EnumType.STRING)
    private MessageType messageType = MessageType.TEXT;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum MessageType {
        TEXT, EMOJI, IMAGE
    }
}
```

**Step 4: 创建 Repository**

```java
// RoomRepository.java
package com.watchtogether.repository;

import com.watchtogether.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    List<Room> findByIsPublicTrueOrderByCreatedAtDesc();
}

// SessionRepository.java  
package com.watchtogether.repository;

import com.watchtogether.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
}

// ChatMessageRepository.java
package com.watchtogether.repository;

import com.watchtogether.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByRoomIdOrderByCreatedAtDesc(String roomId, Pageable pageable);
}
```

**Step 5: Commit**

```bash
git add src/main/java/com/watchtogether/model/ src/main/java/com/watchtogether/repository/
git commit -m "feat: add data models and repositories"
```

---

### Task 6: 会话服务

**Files:**
- Create: `backend/src/main/java/com/watchtogether/service/SessionService.java`
- Create: `backend/src/main/java/com/watchtogether/controller/SessionController.java`

**Step 1: Session Service**

```java
package com.watchtogether.service;

import com.watchtogether.dto.ApiResponse;
import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SessionService {
    
    private final SessionRepository sessionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String SESSION_KEY_PREFIX = "session:";
    private static final long SESSION_TTL_DAYS = 7;
    
    public Session createSession(String nickname) {
        String sessionId = "sess_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        
        Session session = new Session();
        session.setId(sessionId);
        session.setNickname(nickname != null ? nickname : "游客" + (int)(Math.random() * 10000));
        
        // 保存到数据库
        session = sessionRepository.save(session);
        
        // 缓存到 Redis
        redisTemplate.opsForValue().set(
            SESSION_KEY_PREFIX + sessionId,
            session,
            SESSION_TTL_DAYS,
            TimeUnit.DAYS
        );
        
        return session;
    }
    
    public Session getSession(String sessionId) {
        // 先从 Redis 获取
        Object cached = redisTemplate.opsForValue().get(SESSION_KEY_PREFIX + sessionId);
        if (cached instanceof Session) {
            return (Session) cached;
        }
        
        // 从数据库获取
        return sessionRepository.findById(sessionId).orElse(null);
    }
    
    public Session updateSession(String sessionId, String nickname, String avatar) {
        Session session = getSession(sessionId);
        if (session == null) {
            return null;
        }
        
        if (nickname != null) {
            session.setNickname(nickname);
        }
        if (avatar != null) {
            session.setAvatar(avatar);
        }
        
        session = sessionRepository.save(session);
        
        // 更新 Redis 缓存
        redisTemplate.opsForValue().set(
            SESSION_KEY_PREFIX + sessionId,
            session,
            SESSION_TTL_DAYS,
            TimeUnit.DAYS
        );
        
        return session;
    }
}
```

**Step 2: Session Controller**

```java
package com.watchtogether.controller;

import com.watchtogether.dto.ApiResponse;
import com.watchtogether.model.Session;
import com.watchtogether.service.SessionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    
    private final SessionService sessionService;
    
    @PostMapping
    public ApiResponse<Session> createSession(@RequestBody CreateSessionRequest request) {
        Session session = sessionService.createSession(request.getNickname());
        return ApiResponse.success(session);
    }
    
    @GetMapping("/{sessionId}")
    public ApiResponse<Session> getSession(@PathVariable String sessionId) {
        Session session = sessionService.getSession(sessionId);
        if (session == null) {
            return ApiResponse.error(404, "会话不存在");
        }
        return ApiResponse.success(session);
    }
    
    @PutMapping("/{sessionId}")
    public ApiResponse<Session> updateSession(
            @PathVariable String sessionId,
            @RequestBody UpdateSessionRequest request) {
        Session session = sessionService.updateSession(
            sessionId, 
            request.getNickname(), 
            request.getAvatar()
        );
        if (session == null) {
            return ApiResponse.error(404, "会话不存在");
        }
        return ApiResponse.success(session);
    }
    
    @Data
    public static class CreateSessionRequest {
        private String nickname;
    }
    
    @Data
    public static class UpdateSessionRequest {
        private String nickname;
        private String avatar;
    }
}
```

**Step 3: Commit**

```bash
git add src/main/java/com/watchtogether/service/ src/main/java/com/watchtogether/controller/
git commit -m "feat: add session service and API"
```

---

### Task 7: 房间服务

**Files:**
- Create: `backend/src/main/java/com/watchtogether/service/RoomService.java`
- Create: `backend/src/main/java/com/watchtogether/controller/RoomController.java`

**Step 1: Room Service**

```java
package com.watchtogether.service;

import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RoomService {
    
    private final RoomRepository roomRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String ROOM_KEY_PREFIX = "room:";
    private static final String PUBLIC_ROOMS_KEY = "public:rooms";
    
    public Room createRoom(CreateRoomRequest request) {
        String roomId = generateRoomId();
        
        Room room = new Room();
        room.setId(roomId);
        room.setName(request.getName());
        room.setMaxUsers(request.getMaxUsers() != null ? request.getMaxUsers() : 5);
        room.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : true);
        room.setCreatorSessionId(request.getCreatorSessionId());
        
        room = roomRepository.save(room);
        
        // 缓存到 Redis
        cacheRoom(room);
        
        // 添加到公开房间列表
        if (room.getIsPublic()) {
            redisTemplate.opsForZSet().add(PUBLIC_ROOMS_KEY, roomId, System.currentTimeMillis());
        }
        
        return room;
    }
    
    public Room getRoom(String roomId) {
        // 从 Redis 获取
        Object cached = redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + roomId);
        if (cached instanceof Room) {
            return (Room) cached;
        }
        
        // 从数据库获取
        return roomRepository.findById(roomId).orElse(null);
    }
    
    public List<Room> getPublicRooms() {
        return roomRepository.findByIsPublicTrueOrderByCreatedAtDesc();
    }
    
    public void deleteRoom(String roomId, String sessionId) {
        Room room = getRoom(roomId);
        if (room == null || !room.getCreatorSessionId().equals(sessionId)) {
            return;
        }
        
        roomRepository.deleteById(roomId);
        
        // 删除 Redis 缓存
        redisTemplate.delete(ROOM_KEY_PREFIX + roomId);
        redisTemplate.opsForZSet().remove(PUBLIC_ROOMS_KEY, roomId);
    }
    
    private void cacheRoom(Room room) {
        redisTemplate.opsForValue().set(
            ROOM_KEY_PREFIX + room.getId(),
            room,
            1,
            TimeUnit.HOURS
        );
    }
    
    private String generateRoomId() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    @Data
    public static class CreateRoomRequest {
        private String name;
        private Integer maxUsers;
        private Boolean isPublic;
        private String creatorSessionId;
    }
}
```

**Step 2: Room Controller**

```java
package com.watchtogether.controller;

import com.watchtogether.dto.ApiResponse;
import com.watchtogether.model.Room;
import com.watchtogether.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomService roomService;
    
    @PostMapping
    public ApiResponse<Room> createRoom(@RequestBody RoomService.CreateRoomRequest request) {
        Room room = roomService.createRoom(request);
        return ApiResponse.success(room);
    }
    
    @GetMapping
    public ApiResponse<List<Room>> getPublicRooms() {
        List<Room> rooms = roomService.getPublicRooms();
        return ApiResponse.success(rooms);
    }
    
    @GetMapping("/{roomId}")
    public ApiResponse<Room> getRoom(@PathVariable String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) {
            return ApiResponse.error(404, "房间不存在");
        }
        return ApiResponse.success(room);
    }
    
    @DeleteMapping("/{roomId}")
    public ApiResponse<Void> deleteRoom(
            @PathVariable String roomId,
            @RequestParam String sessionId) {
        roomService.deleteRoom(roomId, sessionId);
        return ApiResponse.success();
    }
    
    @GetMapping("/{roomId}/invite")
    public ApiResponse<Map<String, String>> getInviteLink(
            @PathVariable String roomId,
            @RequestParam String baseUrl) {
        String inviteLink = baseUrl + "/join/" + roomId;
        return ApiResponse.success(Map.of("inviteLink", inviteLink, "roomId", roomId));
    }
}
```

**Step 3: Commit**

```bash
git commit -m "feat: add room service and API"
```

---

### Task 8: Socket.io 事件处理器

**Files:**
- Create: `backend/src/main/java/com/watchtogether/handler/SocketEventHandler.java`
- Create: `backend/src/main/java/com/watchtogether/config/SocketIOStartup.java`

**Step 1: Socket 事件处理器**

```java
package com.watchtogether.handler;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.watchtogether.model.ChatMessage;
import com.watchtogether.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketEventHandler {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ChatMessageRepository chatMessageRepository;
    
    private static final String ROOM_USERS_KEY_PREFIX = "room:users:";
    private static final String SOCKET_SESSION_KEY_PREFIX = "socket:session:";
    private static final String ROOM_STATE_KEY_PREFIX = "room:state:";
    
    // 内存中维护房间在线用户
    private final Map<String, Map<String, String>> roomUsers = new ConcurrentHashMap<>();
    
    @OnConnect
    public void onConnect(SocketIOClient client) {
        log.info("Client connected: {}", client.getSessionId());
    }
    
    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        log.info("Client disconnected: {}", client.getSessionId());
        
        // 获取用户所在房间并离开
        String sessionId = (String) redisTemplate.opsForValue().get(SOCKET_SESSION_KEY_PREFIX + client.getSessionId());
        if (sessionId != null) {
            String roomId = (String) redisTemplate.opsForValue().get("session:" + sessionId + ":room");
            if (roomId != null) {
                leaveRoom(client, roomId, sessionId);
            }
        }
    }
    
    @OnEvent("join-room")
    public void onJoinRoom(SocketIOClient client, Map<String, String> data) {
        String roomId = data.get("roomId");
        String sessionId = data.get("sessionId");
        String nickname = data.get("nickname");
        
        // 加入 Socket 房间
        client.joinRoom(roomId);
        
        // 记录 Socket 和 Session 的映射
        redisTemplate.opsForValue().set(SOCKET_SESSION_KEY_PREFIX + client.getSessionId(), sessionId);
        redisTemplate.opsForValue().set("session:" + sessionId + ":room", roomId);
        
        // 添加用户到房间在线列表
        Map<String, String> users = roomUsers.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        users.put(sessionId, nickname);
        
        // 广播用户加入
        client.getNamespace().getRoomOperations(roomId).sendEvent("user-joined", Map.of(
            "sessionId", sessionId,
            "nickname", nickname
        ));
        
        // 发送房间当前状态给新用户
        Map<String, Object> roomState = getRoomState(roomId);
        client.sendEvent("room-state", roomState);
        
        log.info("User {} joined room {}", nickname, roomId);
    }
    
    @OnEvent("leave-room")
    public void onLeaveRoom(SocketIOClient client, Map<String, String> data) {
        String roomId = data.get("roomId");
        String sessionId = data.get("sessionId");
        
        leaveRoom(client, roomId, sessionId);
    }
    
    private void leaveRoom(SocketIOClient client, String roomId, String sessionId) {
        client.leaveRoom(roomId);
        
        // 移除用户
        Map<String, String> users = roomUsers.get(roomId);
        if (users != null) {
            String nickname = users.remove(sessionId);
            
            // 广播用户离开
            client.getNamespace().getRoomOperations(roomId).sendEvent("user-left", Map.of(
                "sessionId", sessionId,
                "nickname", nickname != null ? nickname : "未知用户"
            ));
            
            // 如果房间没人了，可以选择解散房间
            if (users.isEmpty()) {
                // 延迟处理，让用户有时间重新加入
            }
        }
        
        // 清理映射
        redisTemplate.delete(SOCKET_SESSION_KEY_PREFIX + client.getSessionId());
        redisTemplate.delete("session:" + sessionId + ":room");
        
        log.info("User left room {}", roomId);
    }
    
    @OnEvent("video:play")
    public void onVideoPlay(SocketIOClient client, Map<String, Object> data) {
        String roomId = (String) data.get("roomId");
        Double time = ((Number) data.get("time")).doubleValue();
        
        // 更新房间视频状态
        updateRoomVideoState(roomId, "isPlaying", true);
        updateRoomVideoState(roomId, "currentTime", time);
        
        // 广播给房间内其他用户
        client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-play", Map.of(
            "time", time
        ));
    }
    
    @OnEvent("video:pause")
    public void onVideoPause(SocketIOClient client, Map<String, String> data) {
        String roomId = data.get("roomId");
        
        updateRoomVideoState(roomId, "isPlaying", false);
        
        client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-pause", Map.of());
    }
    
    @OnEvent("video:seek")
    public void onVideoSeek(SocketIOClient client, Map<String, Object> data) {
        String roomId = (String) data.get("roomId");
        Double time = ((Number) data.get("time")).doubleValue();
        
        updateRoomVideoState(roomId, "currentTime", time);
        
        client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-seek", Map.of(
            "time", time
        ));
    }
    
    @OnEvent("video:url-change")
    public void onVideoUrlChange(SocketIOClient client, Map<String, String> data) {
        String roomId = data.get("roomId");
        String url = data.get("url");
        
        updateRoomVideoState(roomId, "url", url);
        updateRoomVideoState(roomId, "currentTime", 0);
        
        client.getNamespace().getRoomOperations(roomId).sendEvent("video:sync-url-change", Map.of(
            "url", url
        ));
    }
    
    @OnEvent("chat:message")
    public void onChatMessage(SocketIOClient client, Map<String, Object> data) {
        String roomId = (String) data.get("roomId");
        String content = (String) data.get("content");
        String type = (String) data.get("type");
        String senderId = (String) data.get("senderId");
        String senderNickname = (String) data.get("senderNickname");
        String timestamp = (String) data.get("timestamp");
        
        // 保存消息到数据库
        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);
        message.setSessionId(senderId);
        message.setContent(content);
        message.setMessageType(ChatMessage.MessageType.valueOf(type.toUpperCase()));
        
        message = chatMessageRepository.save(message);
        
        // 广播消息
        Map<String, Object> messageData = Map.of(
            "id", message.getId(),
            "content", content,
            "type", type,
            "senderId", senderId,
            "senderNickname", senderNickname,
            "timestamp", timestamp,
            "createdAt", message.getCreatedAt().toString()
        );
        
        client.getNamespace().getRoomOperations(roomId).sendEvent("chat:message", messageData);
    }
    
    private void updateRoomVideoState(String roomId, String key, Object value) {
        String stateKey = ROOM_STATE_KEY_PREFIX + roomId;
        redisTemplate.opsForHash().put(stateKey, key, value);
    }
    
    private Map<String, Object> getRoomState(String roomId) {
        String stateKey = ROOM_STATE_KEY_PREFIX + roomId;
        Map<Object, Object> state = redisTemplate.opsForHash().entries(stateKey);
        
        return Map.of(
            "roomId", roomId,
            "users", roomUsers.getOrDefault(roomId, new ConcurrentHashMap<>()).values(),
            "videoState", state
        );
    }
}
```

**Step 2: Socket.io 启动配置**

```java
package com.watchtogether.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.watchtogether.handler.SocketEventHandler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketIOStartup {
    
    private final SocketIOServer socketIOServer;
    private final SocketEventHandler socketEventHandler;
    
    @PostConstruct
    public void start() {
        socketIOServer.start();
        log.info("Socket.io server started");
    }
    
    @PreDestroy
    public void stop() {
        socketIOServer.stop();
        log.info("Socket.io server stopped");
    }
}
```

**Step 3: Commit**

```bash
git add src/main/java/com/watchtogether/handler/
git commit -m "feat: add Socket.io event handler"
```

---

### Task 9: 聊天历史 API

**Files:**
- Modify: `backend/src/main/java/com/watchtogether/controller/RoomController.java`

**Step 1: 添加消息查询接口**

```java
@GetMapping("/{roomId}/messages")
public ApiResponse<Map<String, Object>> getMessages(
        @PathVariable String roomId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "50") int size) {
    
    Page<ChatMessage> messages = chatMessageRepository.findByRoomIdOrderByCreatedAtDesc(
        roomId, 
        PageRequest.of(page - 1, size)
    );
    
    return ApiResponse.success(Map.of(
        "messages", messages.getContent(),
        "page", page,
        "size", size,
        "total", messages.getTotalElements(),
        "totalPages", messages.getTotalPages()
    ));
}
```

需要添加依赖注入：

```java
private final ChatMessageRepository chatMessageRepository;
```

**Step 2: Commit**

```bash
git commit -m "feat: add chat messages API"
```

---

## Phase 3: 增强功能

### Task 10: 表情系统

**Files:**
- Create: `backend/src/main/java/com/watchtogether/model/Emoji.java`
- Create: `backend/src/main/java/com/watchtogether/repository/EmojiRepository.java`
- Create: `backend/src/main/java/com/watchtogether/service/EmojiService.java`
- Create: `backend/src/main/java/com/watchtogether/controller/EmojiController.java`

### Task 11: 文件上传

**Files:**
- Create: `backend/src/main/java/com/watchtogether/controller/VideoController.java`
- Create: `backend/src/main/java/com/watchtogether/controller/FileController.java`

---

## Phase 4: 优化部署

### Task 12: Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml`

---

## 执行建议

1. **按 Phase 顺序开发**：基础设施 → 核心功能 → 增强功能
2. **每个 Task 完成后测试**：确保基本功能可用后再继续
3. **前后端联调**：Phase 2 完成后进行联调测试
4. **数据库初始化**：首次启动会自动创建表

---

**Plan version**: v1.0  
**Created**: 2026-02-28
