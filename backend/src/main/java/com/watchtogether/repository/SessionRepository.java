package com.watchtogether.repository;

import com.watchtogether.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    Optional<Session> findBySocketId(String socketId);

    List<Session> findByRoomId(Long roomId);

    @Modifying
    @Query("UPDATE Session s SET s.socketId = :socketId, s.lastSeenAt = :now WHERE s.id = :sessionId")
    void updateSocketInfo(@Param("sessionId") String sessionId, 
                          @Param("socketId") String socketId, 
                          @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Session s SET s.roomId = :roomId, s.lastSeenAt = :now WHERE s.id = :sessionId")
    void updateRoom(@Param("sessionId") String sessionId, 
                    @Param("roomId") Long roomId, 
                    @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Session s SET s.roomId = null, s.lastSeenAt = :now WHERE s.id = :sessionId")
    void leaveRoom(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Session s SET s.lastSeenAt = :now WHERE s.id = :sessionId")
    void updateLastSeen(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);
}