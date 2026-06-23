package com.groupXX.pitchperfect.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.dto.request.PitchCreateRequest;
import com.groupXX.pitchperfect.dto.response.PitchDTO;
import com.groupXX.pitchperfect.exception.ResourceNotFoundException;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PitchService {

    private final PitchRepository pitchRepository;
    private final UserRepository userRepository;
    private final com.groupXX.pitchperfect.repository.BookingRepository bookingRepository;

    @Transactional
    public PitchDTO createPitch(PitchCreateRequest request, String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User manager = creator; // Default: creator manages their own pitch
        
        // If an ADMIN is creating the pitch and provides a managerId, assign that manager
        if (creator.getRole() == User.Role.ADMIN && request.managerId() != null) {
            manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            if (manager.getRole() != User.Role.MANAGER && manager.getRole() != User.Role.ADMIN) {
                throw new IllegalStateException("Assigned user must be a Manager or Admin.");
            }
        }

        // Join imageUrls list into |||-separated string for storage
        String imageUrlsStr = null;
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            imageUrlsStr = String.join("|||", request.imageUrls().stream()
                    .filter(url -> url != null && !url.isBlank())
                    .toList());
        }

        // Primary imageUrl: first from list if not provided explicitly
        String primaryImageUrl = request.imageUrl();
        if ((primaryImageUrl == null || primaryImageUrl.isBlank()) && imageUrlsStr != null) {
            primaryImageUrl = request.imageUrls().get(0);
        }

        Pitch pitch = Pitch.builder()
                .name(request.name())
                .location(request.location())
                .pricePerHour(request.pricePerHour())
                .isAvailable(true)
                .imageUrl(primaryImageUrl)
                .imageUrls(imageUrlsStr)
                .manager(manager)
                .createdBy(creator)
                .build();
        
        Pitch savedPitch = pitchRepository.save(pitch);
        return mapToDTO(savedPitch);
    }

    @Transactional(readOnly = true)
    public Page<PitchDTO> getAllPitches(Pageable pageable) {
        return pitchRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<PitchDTO> searchAvailablePitches(String location, BigDecimal maxPrice, Pageable pageable) {
        return pitchRepository.findAvailablePitchesByLocationAndPrice(location, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    private PitchDTO mapToDTO(Pitch pitch) {
        // Parse imageUrls back into a List (handle both old comma-separated and new |||-separated)
        List<String> imageUrlList = Collections.emptyList();
        if (pitch.getImageUrls() != null && !pitch.getImageUrls().isBlank()) {
            if (pitch.getImageUrls().contains("|||")) {
                imageUrlList = Arrays.stream(pitch.getImageUrls().split("\\|\\|\\|"))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toList();
            } else if (pitch.getImageUrls().startsWith("data:image")) {
                imageUrlList = List.of(pitch.getImageUrls().trim());
            } else {
                imageUrlList = Arrays.stream(pitch.getImageUrls().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toList();
            }
        } else if (pitch.getImageUrl() != null && !pitch.getImageUrl().isBlank()) {
            imageUrlList = List.of(pitch.getImageUrl());
        }

        java.time.LocalDateTime currentBookingEndTime = bookingRepository
                .findCurrentActiveBookingEndTime(pitch.getId(), java.time.LocalDateTime.now())
                .orElse(null);
                
        java.time.LocalDateTime nextBookingStartTime = bookingRepository
                .findNextUpcomingBookingStartTime(pitch.getId(), java.time.LocalDateTime.now())
                .orElse(null);

        return new PitchDTO(pitch.getId(), pitch.getName(), pitch.getLocation(),
                pitch.getPricePerHour(), pitch.isAvailable(), pitch.getImageUrl(),
                imageUrlList, pitch.getCreatedAt(), currentBookingEndTime, nextBookingStartTime,
                pitch.getManager() != null ? pitch.getManager().getId() : null,
                pitch.getCreatedBy() != null ? pitch.getCreatedBy().getFirstName() + " " + pitch.getCreatedBy().getLastName() : "Unknown");
    }

    @Transactional
    public void deletePitch(Long pitchId, String userEmail) {
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN && !pitch.getManager().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to delete this pitch.");
        }
        
        pitchRepository.delete(pitch);
    }

    @Transactional
    public void toggleAvailability(Long pitchId, String userEmail) {
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN && !pitch.getManager().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to modify this pitch.");
        }
        
        pitch.setAvailable(!pitch.isAvailable());
        pitchRepository.save(pitch);
    }

    @Transactional
    public void updatePrice(Long pitchId, java.math.BigDecimal newPrice, String userEmail) {
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN && !pitch.getManager().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to modify this pitch.");
        }
        
        pitch.setPricePerHour(newPrice);
        pitchRepository.save(pitch);
    }

    @Transactional
    public PitchDTO updatePitch(Long pitchId, PitchCreateRequest request, String userEmail) {
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN && !pitch.getManager().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to modify this pitch.");
        }

        pitch.setName(request.name());
        pitch.setLocation(request.location());
        pitch.setPricePerHour(request.pricePerHour());
        
        // Handle images
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            pitch.setImageUrls(String.join("|||", request.imageUrls()));
            pitch.setImageUrl(request.imageUrls().get(0));
        } else if (request.imageUrl() != null) {
            pitch.setImageUrl(request.imageUrl());
            pitch.setImageUrls(request.imageUrl());
        }

        Pitch updatedPitch = pitchRepository.save(pitch);
        return mapToDTO(updatedPitch);
    }
}
