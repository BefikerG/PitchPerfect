package com.groupXX.pitchperfect.service;

import com.groupXX.pitchperfect.model.Booking;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.BookingRepository;
import com.groupXX.pitchperfect.repository.PaymentRepository;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private PitchRepository pitchRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBooking_ShouldThrowException_WhenDoubleBookingOccurs() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        Pitch pitch = new Pitch();
        pitch.setId(1L);
        pitch.setPricePerHour(new BigDecimal("100.00"));
        pitch.setAvailable(true);
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(2);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(pitchRepository.findById(1L)).thenReturn(Optional.of(pitch));

        // Simulate that the database found 1 existing booking at this time
        when(bookingRepository.countConflictingBookings(1L, start, end)).thenReturn(1L);
        when(bookingRepository.findNextAvailableTime(eq(1L), any())).thenReturn(Optional.of(end.plusHours(1)));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
            bookingService.createBooking("user@test.com", 1L, start, end)
        );

        assertTrue(exception.getMessage().contains("DOUBLE_BOOKING_PREVENTED"));
        // Verify that the save method was NEVER called because the exception stopped it
        verify(bookingRepository, never()).save(any(Booking.class));
    }
}