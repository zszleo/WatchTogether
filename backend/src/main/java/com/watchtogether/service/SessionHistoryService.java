package com.watchtogether.service;

import com.watchtogether.model.SessionHistory;
import com.watchtogether.repository.SessionHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SessionHistoryService {

    private static final Logger logger = LoggerFactory.getLogger(SessionHistoryService.class);

    private final SessionHistoryRepository historyRepository;

    @Autowired
    public SessionHistoryService(SessionHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    @Transactional
    public SessionHistory joinRoom(String sessionId, Long roomId, String roomName, String videoTitle) {
        SessionHistory history = new SessionHistory();
        history.setSessionId(sessionId);
        history.setRoomId(roomId);
        history.setRoomName(roomName);
        history.setVideoTitle(videoTitle);

        SessionHistory saved = historyRepository.save(history);
        logger.info("Session {} joined room {} (history id: {})", sessionId, roomId, saved.getId());
        return saved;
    }

    @Transactional
    public void leaveRoom(Long historyId) {
        Optional<SessionHistory> historyOpt = historyRepository.findById(historyId);
        if (historyOpt.isPresent()) {
            SessionHistory history = historyOpt.get();
            history.setLeftAt(LocalDateTime.now());
            historyRepository.save(history);
            logger.info("Session {} left room {} (history id: {})", 
                       history.getSessionId(), history.getRoomId(), historyId);
        }
    }

    public List<SessionHistory> getUserHistory(String sessionId) {
        return historyRepository.findBySessionIdOrderByJoinedAtDesc(sessionId);
    }

    public List<SessionHistory> getUserHistoryWithLimit(String sessionId, int limit) {
        if (limit <= 0) {
            return List.of();
        }
        return historyRepository.findBySessionIdOrderByJoinedAtDescLimit(sessionId, PageRequest.of(0, limit));
    }
}
