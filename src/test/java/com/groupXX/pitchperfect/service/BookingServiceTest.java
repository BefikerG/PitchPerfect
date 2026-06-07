package com.groupXX.pitchperfect.service;

import com.groupXX.pitchperfect.model.Booking;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.BookingRepository;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private PitchRepository pitchRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBooking_ShouldThrowException_WhenDoubleBookingOccurs() {
        // Arrange
        User user = new User();
        user.setId(1L);
        Pitch pitch = new Pitch();
        pitch.setId(1L);
        pitch.setAvailable(true);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(pitchRepository.findById(1L)).thenReturn(Optional.of(pitch));

        // Simulate that the database found 1 existing booking at this time
        when(bookingRepository.countConflictingBookings(1L, start, end)).thenReturn(1L);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            bookingService.createBooking(1L, 1L, start, end);
        });

        assertEquals("Double Booking Prevented: Pitch is already reserved for this time slot.", exception.getMessage());
        // Verify that the save method was NEVER called because the exception stopped it
        verify(bookingRepository, never()).save(any(Booking.class));
    }
}