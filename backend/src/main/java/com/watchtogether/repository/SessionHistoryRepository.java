package com.watchtogether.repository;

import com.watchtogether.model.SessionHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionHistoryRepository extends JpaRepository<SessionHistory, Long> {

    List<SessionHistory> findBySessionIdOrderByJoinedAtDesc(String sessionId);

    @Query("SELECT sh FROM SessionHistory sh WHERE sh.sessionId = :sessionId ORDER BY sh.joinedAt DESC")
    List<SessionHistory> findBySessionIdOrderByJoinedAtDescLimit(String sessionId, Pageable pageable);
}
