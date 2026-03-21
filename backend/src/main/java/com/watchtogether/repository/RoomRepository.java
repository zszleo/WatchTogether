package com.watchtogether.repository;

import com.watchtogether.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByCode(String code);

    List<Room> findByIsPublicTrueOrderByLastActivityAtDesc();

    Page<Room> findByIsPublicTrueOrderByLastActivityAtDesc(Pageable pageable);

    List<Room> findByIsPublicTrueAndNameContainingIgnoreCaseOrderByLastActivityAtDesc(String name);

    List<Room> findByOwnerSessionId(String ownerSessionId);

    @Query("SELECT r FROM Room r WHERE r.lastActivityAt < :threshold")
    List<Room> findInactiveRooms(@Param("threshold") LocalDateTime threshold);

    @Modifying
    @Query("UPDATE Room r SET r.videoUrl = :videoUrl, r.videoTitle = :videoTitle, r.videoDuration = :videoDuration WHERE r.id = :roomId")
    void updateVideoInfo(@Param("roomId") Long roomId, 
                         @Param("videoUrl") String videoUrl, 
                         @Param("videoTitle") String videoTitle, 
                         @Param("videoDuration") Integer videoDuration);

    @Modifying
    @Query("UPDATE Room r SET r.currentPlaybackTime = :time, r.isPlaying = :isPlaying, r.lastActivityAt = :now WHERE r.id = :roomId")
    void updatePlaybackState(@Param("roomId") Long roomId, 
                             @Param("time") Double time, 
                             @Param("isPlaying") Boolean isPlaying, 
                             @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Room r SET r.lastActivityAt = :now WHERE r.id = :roomId")
    void updateLastActivity(@Param("roomId") Long roomId, @Param("now") LocalDateTime now);
}