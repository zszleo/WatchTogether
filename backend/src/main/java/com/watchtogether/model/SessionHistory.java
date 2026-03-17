package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "session_history")
public class SessionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 32)
    private String sessionId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "room_name", length = 100)
    private String roomName;

    @Column(name = "video_title", length = 200)
    private String videoTitle;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
