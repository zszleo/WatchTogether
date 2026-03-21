package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @Column(name = "id", nullable = false, length = 32)
    private String id;

    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Column(name = "avatar", length = 200)
    private String avatar;

    @Column(name = "socket_id", length = 50)
    private String socketId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastSeenAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}