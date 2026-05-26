package com.skillsignal.connection.repository;

import com.skillsignal.connection.model.ConnectionStatus;
import com.skillsignal.connection.model.DeveloperConnection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeveloperConnectionRepository extends JpaRepository<DeveloperConnection, Long> {
    @Query("""
            select connection from DeveloperConnection connection
            where (connection.requesterUserId = :firstUserId and connection.receiverUserId = :secondUserId)
               or (connection.requesterUserId = :secondUserId and connection.receiverUserId = :firstUserId)
            """)
    Optional<DeveloperConnection> findBetweenUsers(
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId
    );

    List<DeveloperConnection> findByReceiverUserIdAndStatusOrderByCreatedAtDesc(Long receiverUserId, ConnectionStatus status);

    Optional<DeveloperConnection> findByIdAndRequesterUserIdAndStatus(
            Long id,
            Long requesterUserId,
            ConnectionStatus status
    );

    @Query("""
            select connection from DeveloperConnection connection
            where connection.status = :status
              and (connection.requesterUserId = :userId or connection.receiverUserId = :userId)
            order by connection.createdAt desc
            """)
    List<DeveloperConnection> findForUserByStatus(
            @Param("userId") Long userId,
            @Param("status") ConnectionStatus status
    );

    @Query("""
            select connection from DeveloperConnection connection
            where connection.requesterUserId = :userId or connection.receiverUserId = :userId
            order by connection.createdAt desc
            """)
    List<DeveloperConnection> findForUser(@Param("userId") Long userId);
}
