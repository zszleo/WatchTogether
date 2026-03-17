package com.watchtogether.service;

import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.utils.RedisUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);

    private final RedisUtil redisUtil;
    private final SessionRepository sessionRepository;

    @Autowired
    public SessionService(RedisUtil redisUtil, SessionRepository sessionRepository) {
        this.redisUtil = redisUtil;
        this.sessionRepository = sessionRepository;
    }

    public Session createSession(String nickname, String avatar) {
        String sessionId = generateSessionId();
        
        Session session = new Session();
        session.setId(sessionId);
        session.setNickname(nickname);
        session.setAvatar(avatar);
        session.setIsOnline(false);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        session.setLastSeenAt(LocalDateTime.now());
        
        sessionRepository.save(session);
        
        // Cache session in Redis
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("id", sessionId);
        sessionData.put("nickname", nickname);
        sessionData.put("avatar", avatar);
        sessionData.put("createdAt", session.getCreatedAt().toString());
        redisUtil.setSession(sessionId, sessionData);
        
        logger.info("Created new session: {} for nickname: {}", sessionId, nickname);
        return session;
    }

    public Optional<Session> getSession(String sessionId) {
        // Try Redis first
        Map<String, Object> cached = redisUtil.getSession(sessionId, Map.class);
        if (cached != null) {
            Session session = new Session();
            session.setId((String) cached.get("id"));
            session.setNickname((String) cached.get("nickname"));
            session.setAvatar((String) cached.get("avatar"));
            // Note: other fields may be missing in cache
            return Optional.of(session);
        }
        
        // Fallback to database
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            // Cache it for future use
            Session session = sessionOpt.get();
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("id", session.getId());
            sessionData.put("nickname", session.getNickname());
            sessionData.put("avatar", session.getAvatar());
            sessionData.put("createdAt", session.getCreatedAt().toString());
            redisUtil.setSession(sessionId, sessionData);
        }
        
        return sessionOpt;
    }

    public boolean validateSession(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            return false;
        }
        
        // Check Redis cache first
        if (redisUtil.hasKey(RedisUtil.KEY_PREFIX_SESSION + sessionId)) {
            return true;
        }
        
        // Check database
        return sessionRepository.existsById(sessionId);
    }

    public void updateSessionSocket(String sessionId, String socketId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setSocketId(socketId);
            session.setIsOnline(true);
            session.setLastSeenAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            // Update Redis cache
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("id", session.getId());
            sessionData.put("nickname", session.getNickname());
            sessionData.put("avatar", session.getAvatar());
            sessionData.put("socketId", socketId);
            sessionData.put("createdAt", session.getCreatedAt().toString());
            redisUtil.setSession(sessionId, sessionData);
            
            logger.info("Updated session {} with socket {}", sessionId, socketId);
        }
    }

    public void updateSessionLastSeen(String sessionId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setLastSeenAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            // Also update Redis TTL by re-setting
            Map<String, Object> sessionData = redisUtil.getSession(sessionId, Map.class);
            if (sessionData != null) {
                redisUtil.setSession(sessionId, sessionData);
            }
        }
    }

    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
        redisUtil.deleteSession(sessionId);
        logger.info("Deleted session: {}", sessionId);
    }

    public void joinRoom(String sessionId, Long roomId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setRoomId(roomId);
            session.setLastSeenAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            logger.info("Session {} joined room {}", sessionId, roomId);
        }
    }

    public void leaveRoom(String sessionId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            session.setRoomId(null);
            session.setLastSeenAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            logger.info("Session {} left room", sessionId);
        }
    }

    public Optional<Session> updateSession(String sessionId, String nickname, String avatar) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            Session session = sessionOpt.get();
            
            if (nickname != null && !nickname.trim().isEmpty()) {
                session.setNickname(nickname);
            }
            if (avatar != null) {
                session.setAvatar(avatar);
            }
            
            sessionRepository.save(session);
            
            // Update Redis cache
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("id", session.getId());
            sessionData.put("nickname", session.getNickname());
            sessionData.put("avatar", session.getAvatar());
            sessionData.put("createdAt", session.getCreatedAt().toString());
            redisUtil.setSession(sessionId, sessionData);
            
            logger.info("Updated session {} - nickname: {}, avatar: {}", sessionId, nickname, avatar);
            return Optional.of(session);
        }
        return Optional.empty();
    }

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
}