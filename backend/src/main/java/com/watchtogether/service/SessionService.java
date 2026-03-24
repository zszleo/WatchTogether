package com.watchtogether.service;

import lombok.extern.slf4j.Slf4j;
import com.watchtogether.model.Session;
import com.watchtogether.repository.SessionRepository;
import com.watchtogether.utils.RedisUtil;

import jakarta.annotation.Resource;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static com.watchtogether.common.AppConstants.*;

@Slf4j
@Service
public class SessionService {

    @Resource
    private RedisUtil redisUtil;
    @Resource
    private SessionRepository sessionRepository;

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public Session createSession(String nickname, String avatar) {
        log.debug("Starting transaction for createSession, nickname: {}", nickname);
        try {
            String sessionId = generateSessionId();
            
            Session session = new Session();
            session.setId(sessionId);
            session.setNickname(nickname);
            session.setAvatar(avatar);
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
            redisUtil.set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
            
            log.debug("Transaction committed successfully for session: {}", sessionId);
            log.info("Created new session: {} for nickname: {}", sessionId, nickname);
            return session;
        } catch (Exception e) {
            log.error("Transaction failed for createSession, nickname: {}", nickname, e);
            throw e;
        }
    }

    public Optional<Session> getSession(String sessionId) {
        // Try Redis first
        Map<String, Object> cached = redisUtil.get(KEY_PREFIX_SESSION + sessionId, Map.class);
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
            redisUtil.set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
        }
        
        return sessionOpt;
    }

    public boolean validateSession(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            return false;
        }
        
        // Check Redis cache first
        if (redisUtil.hasKey(KEY_PREFIX_SESSION + sessionId)) {
            return true;
        }
        
        // Check database
        return sessionRepository.existsById(sessionId);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public void updateSessionSocket(String sessionId, String socketId) {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateSocketInfo(sessionId, socketId, now);
        
        // Update Redis cache
        Map<String, Object> sessionData = redisUtil.get(KEY_PREFIX_SESSION + sessionId, Map.class);
        if (sessionData != null) {
            sessionData.put("socketId", socketId);
            redisUtil.set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
        }
        
        log.info("Updated session {} with socket {}", sessionId, socketId);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public void updateSessionLastSeen(String sessionId) {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateLastSeen(sessionId, now);
        
        // Also update Redis TTL by re-setting
        Map<String, Object> sessionData = redisUtil.get(KEY_PREFIX_SESSION + sessionId, Map.class);
        if (sessionData != null) {
            redisUtil.set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
        }
        
        log.debug("Updated last seen for session {}", sessionId);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
        // todo 删除房间关联等相关数据
        redisUtil.delete(KEY_PREFIX_SESSION + sessionId);
        log.info("Deleted session: {}", sessionId);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public void joinRoom(String sessionId, Long roomId) {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateRoom(sessionId, roomId, now);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
    public void leaveRoom(String sessionId) {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.leaveRoom(sessionId, now);
        log.info("Session {} left room", sessionId);
    }

    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED)
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
            redisUtil.set(KEY_PREFIX_SESSION + sessionId, sessionData, TTL_SESSION);
            
            log.info("Updated session {} - nickname: {}, avatar: {}", sessionId, nickname, avatar);
            return Optional.of(session);
        }
        return Optional.empty();
    }

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
}
