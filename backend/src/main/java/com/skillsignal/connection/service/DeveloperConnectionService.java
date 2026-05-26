package com.skillsignal.connection.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsignal.connection.dto.ConnectionFeedItemResponse;
import com.skillsignal.connection.dto.DeveloperConnectionResponse;
import com.skillsignal.connection.model.ConnectionStatus;
import com.skillsignal.connection.model.DeveloperConnection;
import com.skillsignal.connection.repository.DeveloperConnectionRepository;
import com.skillsignal.marketplace.dto.ProfilePostResponse;
import com.skillsignal.marketplace.model.MarketplaceProfile;
import com.skillsignal.marketplace.model.ProfileType;
import com.skillsignal.marketplace.repository.MarketplaceProfileRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeveloperConnectionService {
    private final MarketplaceProfileRepository profileRepository;
    private final DeveloperConnectionRepository connectionRepository;
    private final ObjectMapper objectMapper;

    public DeveloperConnectionService(
            MarketplaceProfileRepository profileRepository,
            DeveloperConnectionRepository connectionRepository,
            ObjectMapper objectMapper
    ) {
        this.profileRepository = profileRepository;
        this.connectionRepository = connectionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DeveloperConnectionResponse requestConnection(Long requesterUserId, Long receiverProfileId) {
        MarketplaceProfile requesterProfile = developerProfileForUser(requesterUserId);
        MarketplaceProfile receiverProfile = profileRepository.findById(receiverProfileId)
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .filter(MarketplaceProfile::isDisplayed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Developer profile not found."));

        if (receiverProfile.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This developer is not accepting connections yet.");
        }
        if (requesterUserId.equals(receiverProfile.getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot connect with yourself.");
        }

        DeveloperConnection connection = connectionRepository
                .findBetweenUsers(requesterUserId, receiverProfile.getUserId())
                .orElseGet(() -> connectionRepository.save(new DeveloperConnection(
                        requesterUserId,
                        receiverProfile.getUserId(),
                        requesterProfile,
                        receiverProfile
                )));

        return DeveloperConnectionResponse.from(connection);
    }

    @Transactional(readOnly = true)
    public List<DeveloperConnectionResponse> findConnections(Long userId) {
        return connectionRepository.findForUserByStatus(userId, ConnectionStatus.ACCEPTED).stream()
                .map(DeveloperConnectionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeveloperConnectionResponse> findConnectionRequests(Long userId) {
        return connectionRepository.findByReceiverUserIdAndStatusOrderByCreatedAtDesc(userId, ConnectionStatus.PENDING).stream()
                .map(DeveloperConnectionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeveloperConnectionResponse> findAllConnectionActivity(Long userId) {
        return connectionRepository.findForUser(userId).stream()
                .map(DeveloperConnectionResponse::from)
                .toList();
    }

    @Transactional
    public DeveloperConnectionResponse accept(Long userId, Long connectionId) {
        DeveloperConnection connection = pendingConnectionForReceiver(userId, connectionId);
        connection.setStatus(ConnectionStatus.ACCEPTED);
        return DeveloperConnectionResponse.from(connectionRepository.save(connection));
    }

    @Transactional
    public DeveloperConnectionResponse decline(Long userId, Long connectionId) {
        DeveloperConnection connection = pendingConnectionForReceiver(userId, connectionId);
        connection.setStatus(ConnectionStatus.DECLINED);
        return DeveloperConnectionResponse.from(connectionRepository.save(connection));
    }

    @Transactional
    public void cancel(Long userId, Long connectionId) {
        DeveloperConnection connection = connectionRepository
                .findByIdAndRequesterUserIdAndStatus(connectionId, userId, ConnectionStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection request not found."));
        connectionRepository.delete(connection);
    }

    @Transactional(readOnly = true)
    public List<ConnectionFeedItemResponse> findConnectionFeed(Long userId) {
        return connectionRepository.findForUserByStatus(userId, ConnectionStatus.ACCEPTED).stream()
                .map(connection -> connection.getRequesterUserId().equals(userId)
                        ? connection.getReceiverProfile()
                        : connection.getRequesterProfile())
                .flatMap(profile -> readPosts(profile).stream()
                        .map(post -> new ConnectionFeedItemResponse(
                                profile.getId(),
                                profile.getName(),
                                profile.getTitle(),
                                profile.getImage(),
                                post.id(),
                                post.body(),
                                post.createdAt()
                        )))
                .sorted(Comparator.comparing(
                        ConnectionFeedItemResponse::createdAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .limit(30)
                .toList();
    }

    private DeveloperConnection pendingConnectionForReceiver(Long userId, Long connectionId) {
        DeveloperConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection request not found."));
        if (!connection.getReceiverUserId().equals(userId) || connection.getStatus() != ConnectionStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection request not found.");
        }
        return connection;
    }

    private MarketplaceProfile developerProfileForUser(Long userId) {
        return profileRepository.findByUserId(userId)
                .filter(profile -> profile.getType() == ProfileType.DEVELOPER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Create your developer profile before connecting."));
    }

    private List<ProfilePostResponse> readPosts(MarketplaceProfile profile) {
        try {
            return objectMapper.readValue(profile.getPostsJson(), new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }
}
