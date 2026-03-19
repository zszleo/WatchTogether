package com.watchtogether.service;

import com.watchtogether.model.Emoji;
import com.watchtogether.repository.EmojiRepository;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EmojiService {

    @Resource
    public EmojiRepository emojiRepository;

    public List<Emoji> getDefaultEmojis() {
        return emojiRepository.findByIsDefaultTrueOrderByNameAsc();
    }

    public List<Emoji> getEmojisByNickname(String nickname) {
        return emojiRepository.findByNicknameOrderByCreatedAtDesc(nickname);
    }

    @Transactional
    public Emoji addEmojiByNickname(String nickname, String name, String type, String url) {
        Emoji emoji = new Emoji();
        emoji.setName(name);
        emoji.setType(type);
        emoji.setUrl(url);
        emoji.setNickname(nickname);
        emoji.setIsDefault(false);

        Emoji saved = emojiRepository.save(emoji);
        log.info("Added custom emoji {} for nickname {}", name, nickname);
        return saved;
    }

    @Transactional
    public boolean deleteEmojiByNickname(Long emojiId, String nickname) {
        Optional<Emoji> emojiOpt = emojiRepository.findByIdAndNickname(emojiId, nickname);
        if (emojiOpt.isEmpty()) {
            return false;
        }

        emojiRepository.delete(emojiOpt.get());
        log.info("Deleted emoji {} for nickname {}", emojiId, nickname);
        return true;
    }

    public Optional<Emoji> getEmojiById(Long emojiId) {
        return emojiRepository.findById(emojiId);
    }
}
