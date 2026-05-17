package com.groupXX.pitchperfect.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.exception.ResourceNotFoundException;
import com.groupXX.pitchperfect.model.Booking;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.BookingRepository;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PitchRepository pitchRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long createBooking(Long userId, Long pitchId, LocalDateTime startTime, LocalDateTime endTime) {
        // 1. Basic time validation
        if (startTime.isAfter(endTime) || startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid booking time range.");
        }

        // 2. Fetch Entities
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));

        if (!pitch.isAvailable()) {
            throw new IllegalStateException("Pitch is currently disabled for booking.");
        }

        // 3. The Conflict-Free Engine (Requirement F2 / Proposal Risk Mitigation)
        long conflicts = bookingRepository.countConflictingBookings(pitchId, startTime, endTime);
        if (conflicts > 0) {
            throw new IllegalStateException("Double Booking Prevented: Pitch is already reserved for this time slot.");
        }

        // 4. Create and Save
        Booking booking = Booking.builder()
                .user(user)
                .pitch(pitch)
                .startTime(startTime)
                .endTime(endTime)
                .status(Booking.Status.CONFIRMED) // Defaulting to confirmed for now
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return savedBooking.getId();
    }
}