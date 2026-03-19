package com.watchtogether.repository;

import com.watchtogether.model.Emoji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmojiRepository extends JpaRepository<Emoji, Long> {

    List<Emoji> findByIsDefaultTrueOrderByNameAsc();

    List<Emoji> findByNicknameOrderByCreatedAtDesc(String nickname);

    Optional<Emoji> findByIdAndNickname(Long id, String nickname);

    void deleteByIdAndNickname(Long id, String nickname);
}
