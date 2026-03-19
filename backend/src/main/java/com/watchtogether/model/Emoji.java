package com.watchtogether.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "emojis")
public class Emoji {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "unicode", length = 20)
    private String unicode;

    @Column(name = "nickname", length = 50)
    private String nickname;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
