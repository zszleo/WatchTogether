package com.watchtogether.service;

import com.watchtogether.model.Emoji;
import com.watchtogether.model.SessionHistory;
import com.watchtogether.repository.EmojiRepository;
import com.watchtogether.repository.SessionHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmojiService {

    private static final Logger logger = LoggerFactory.getLogger(EmojiService.class);

    private final EmojiRepository emojiRepository;

    @Autowired
    public EmojiService(EmojiRepository emojiRepository) {
        this.emojiRepository = emojiRepository;
    }

    public List<Emoji> getDefaultEmojis() {
        return emojiRepository.findByIsDefaultTrueOrderByNameAsc();
    }

    public List<Emoji> getUserEmojis(String sessionId) {
        return emojiRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
    }

    @Transactional
    public Emoji addUserEmoji(String sessionId, String name, String type, String url) {
        Emoji emoji = new Emoji();
        emoji.setName(name);
        emoji.setType(type);
        emoji.setUrl(url);
        emoji.setSessionId(sessionId);
        emoji.setIsDefault(false);

        Emoji saved = emojiRepository.save(emoji);
        logger.info("Added custom emoji {} for session {}", name, sessionId);
        return saved;
    }

    @Transactional
    public boolean deleteUserEmoji(Long emojiId, String sessionId) {
        Optional<Emoji> emojiOpt = emojiRepository.findByIdAndSessionId(emojiId, sessionId);
        if (emojiOpt.isEmpty()) {
            return false;
        }

        emojiRepository.delete(emojiOpt.get());
        logger.info("Deleted emoji {} for session {}", emojiId, sessionId);
        return true;
    }

    public Optional<Emoji> getEmojiById(Long emojiId) {
        return emojiRepository.findById(emojiId);
    }
}
