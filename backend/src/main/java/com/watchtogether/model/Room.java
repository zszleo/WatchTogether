package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 6)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "max_users", nullable = false)
    private Integer maxUsers = 5;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    @Column(name = "owner_session_id", length = 32)
    private String ownerSessionId;

    @Column(name = "video_url", length = 2048)
    private String videoUrl;

    @Column(name = "video_title", length = 200)
    private String videoTitle;

    @Column(name = "video_duration")
    private Integer videoDuration;

    @Column(name = "current_playback_time")
    private Double currentPlaybackTime = 0.0;

    @Column(name = "is_playing")
    private Boolean isPlaying = false;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastActivityAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}