package com.watchtogether.repository;

import com.watchtogether.model.Emoji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmojiRepository extends JpaRepository<Emoji, Long> {

    List<Emoji> findByIsDefaultTrueOrderByNameAsc();

    List<Emoji> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    Optional<Emoji> findByIdAndSessionId(Long id, String sessionId);

    void deleteByIdAndSessionId(Long id, String sessionId);
}
