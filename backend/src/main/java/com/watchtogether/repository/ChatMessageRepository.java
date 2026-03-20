package com.watchtogether.repository;

import com.watchtogether.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    Page<ChatMessage> findByRoomId(Long roomId, Pageable pageable);

    List<ChatMessage> findByRoomIdAndCreatedAtAfterOrderByCreatedAtDesc(Long roomId, LocalDateTime since);

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.roomId = :roomId ORDER BY cm.createdAt DESC LIMIT :limit")
    List<ChatMessage> findLatestByRoomId(@Param("roomId") Long roomId, @Param("limit") int limit);

    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.roomId = :roomId AND cm.createdAt >= :start AND cm.createdAt < :end")
    Long countByRoomIdAndDateRange(@Param("roomId") Long roomId, 
                                   @Param("start") LocalDateTime start, 
                                   @Param("end") LocalDateTime end);
}