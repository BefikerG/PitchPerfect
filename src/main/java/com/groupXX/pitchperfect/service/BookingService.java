package com.groupXX.pitchperfect.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.dto.response.BookingDTO;
import com.groupXX.pitchperfect.exception.ResourceNotFoundException;
import com.groupXX.pitchperfect.model.Booking;
import com.groupXX.pitchperfect.model.Payment;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.BookingRepository;
import com.groupXX.pitchperfect.repository.PaymentRepository;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PitchRepository pitchRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public synchronized Long createBooking(String userEmail, Long pitchId, LocalDateTime startTime, LocalDateTime endTime) {
        // 1. Basic time validation
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time.");
        }
        if (startTime.isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new IllegalArgumentException("Start time cannot be in the past.");
        }

        // 2. Fetch Entities
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));

        if (!pitch.isAvailable()) {
            throw new IllegalStateException("Pitch is currently disabled for booking.");
        }

        // 3. Conflict-Free Booking Engine with next-available info
        long conflicts = bookingRepository.countConflictingBookings(pitchId, startTime, endTime);
        if (conflicts > 0) {
            Optional<LocalDateTime> nextFree = bookingRepository.findNextAvailableTime(pitchId, LocalDateTime.now());
            String nextFreeStr = nextFree
                    .map(t -> t.format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")))
                    .orElse("unknown time");
            throw new IllegalStateException(
                "DOUBLE_BOOKING_PREVENTED: This pitch is already reserved for that time slot. " +
                "It will be available from: " + nextFreeStr
            );
        }

        // 4. Create and Save Booking
        Booking booking = Booking.builder()
                .user(user)
                .pitch(pitch)
                .startTime(startTime)
                .endTime(endTime)
                .status(Booking.Status.CONFIRMED)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 5. Automated Pricing Calculation
        long minutes = Duration.between(startTime, endTime).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = pitch.getPricePerHour().multiply(hours);

        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(totalAmount)
                .paymentMethod("CREDIT_CARD")
                .paymentDate(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return savedBooking.getId();
    }

    @Transactional
    public java.util.Map<String, Object> cancelBooking(Long bookingId, String userEmail, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Only the booking owner can cancel
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("You are not authorized to cancel this booking.");
        }
        if (booking.getStatus() == Booking.Status.CANCELLED) {
            throw new IllegalStateException("This booking is already cancelled.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = booking.getStartTime();
        long hoursUntilStart = java.time.Duration.between(now, start).toHours();

        // --- Smart Refund Policy ---
        // >12h before start  → 100% refund
        // 2–12h before start → 75% refund (25% cancellation fee)
        // 1–2h before start  → 50% refund (50% cancellation fee)
        // <1h or already started → 0% refund
        BigDecimal refundPercent;
        String policyLabel;
        if (hoursUntilStart > 12) {
            refundPercent = BigDecimal.ONE;
            policyLabel = "Full refund (cancelled > 12h in advance)";
        } else if (hoursUntilStart >= 2) {
            refundPercent = new BigDecimal("0.75");
            policyLabel = "75% refund (cancelled 2–12h in advance)";
        } else if (hoursUntilStart >= 1) {
            refundPercent = new BigDecimal("0.50");
            policyLabel = "50% refund (cancelled 1–2h in advance)";
        } else {
            refundPercent = BigDecimal.ZERO;
            policyLabel = "No refund (cancelled less than 1 hour before start or already started)";
        }

        // Look up the original payment
        Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
        BigDecimal originalAmount = payment != null ? payment.getAmount() : BigDecimal.ZERO;
        BigDecimal refundAmount = originalAmount.multiply(refundPercent).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cancellationFee = originalAmount.subtract(refundAmount);

        // If there's a refund, adjust the payment amount to the cancellation fee only
        if (payment != null) {
            payment.setAmount(cancellationFee);
            paymentRepository.save(payment);
        }

        booking.setStatus(Booking.Status.CANCELLED);
        if (reason != null && !reason.trim().isEmpty()) {
            booking.setCancellationReason(reason);
            // If cancellation fee is applied (refundPercent < 1.0), set refund status to PENDING_APPROVAL
            if (refundPercent.compareTo(BigDecimal.ONE) < 0) {
                booking.setCancellationRefundStatus(Booking.RefundStatus.PENDING_APPROVAL);
            }
        }
        bookingRepository.save(booking);

        return java.util.Map.of(
            "message", "Booking cancelled successfully.",
            "policy", policyLabel,
            "originalAmount", originalAmount,
            "refundAmount", refundAmount,
            "cancellationFee", cancellationFee
        );
    }

    @Transactional(readOnly = true)
    public Page<BookingDTO> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<BookingDTO> getBookingsByUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return bookingRepository.findByUserId(user.getId(), pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<BookingDTO> getBookingsByUserId(Long userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<BookingDTO> getBookingsForManager(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() != User.Role.MANAGER && user.getRole() != User.Role.ADMIN) {
            throw new IllegalStateException("Only managers and admins can view managed bookings.");
        }
        
        return bookingRepository.findByPitchManagerId(user.getId(), pageable).map(this::mapToDTO);
    }

    private BookingDTO mapToDTO(Booking booking) {
        java.math.BigDecimal totalAmount = paymentRepository.findByBookingId(booking.getId())
                .map(p -> p.getAmount())
                .orElse(java.math.BigDecimal.ZERO);
        return new BookingDTO(
                booking.getId(),
                booking.getUser().getId(),
                booking.getUser().getEmail(),
                booking.getUser().getFirstName() + " " + booking.getUser().getLastName(),
                booking.getPitch().getId(),
                booking.getPitch().getName(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus().name(),
                booking.getCreatedAt(),
                totalAmount,
                booking.getCancellationReason(),
                booking.getCancellationResponse(),
                booking.getCancellationRefundStatus().name()
        );
    }

    @Transactional
    public void respondToRefundRequest(Long bookingId, String userEmail, String response, boolean approve) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN && !booking.getPitch().getManager().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to respond to this refund request.");
        }

        if (booking.getCancellationRefundStatus() != Booking.RefundStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("This booking is not pending refund approval.");
        }

        booking.setCancellationResponse(response);
        if (approve) {
            booking.setCancellationRefundStatus(Booking.RefundStatus.APPROVED);
            Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
            if (payment != null) {
                payment.setAmount(java.math.BigDecimal.ZERO);
                paymentRepository.save(payment);
            }
        } else {
            booking.setCancellationRefundStatus(Booking.RefundStatus.REJECTED);
        }
        bookingRepository.save(booking);

        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BookingService.class);
        log.info("CANCELLATION NOTICE COPY FOR ADMIN - Booking ID: {}, Pitch: {}, User: {}, Manager: {}, Reason: {}, Manager Response: {}, Status: {}",
                booking.getId(), booking.getPitch().getName(), booking.getUser().getEmail(), user.getEmail(), booking.getCancellationReason(), response, booking.getCancellationRefundStatus());
    }
}