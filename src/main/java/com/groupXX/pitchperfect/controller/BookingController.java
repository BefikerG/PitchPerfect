package com.groupXX.pitchperfect.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.groupXX.pitchperfect.dto.request.BookingRequest;
import com.groupXX.pitchperfect.dto.response.BookingDTO;
import com.groupXX.pitchperfect.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(
            @Valid @RequestBody BookingRequest request,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "You must be logged in to book a pitch."));
        }

        Long bookingId = bookingService.createBooking(
                principal.getName(),   // email from JWT, not from request body
                request.pitchId(),
                request.startTime(),
                request.endTime()
        );

        return new ResponseEntity<>(Map.of(
                "message", "Booking confirmed successfully",
                "bookingId", bookingId
        ), HttpStatus.CREATED);
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/cancel")
    public ResponseEntity<java.util.Map<String, Object>> cancelBooking(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody(required = false) java.util.Map<String, String> payload,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "You must be logged in to cancel a booking."));
        }
        String reason = payload != null ? payload.get("cancellationReason") : null;
        return ResponseEntity.ok(bookingService.cancelBooking(id, principal.getName(), reason));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingDTO>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(PageRequest.of(page, size)));
    }

    @GetMapping("/user/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingDTO>> getBookingsByUserId(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getBookingsByUserId(id, PageRequest.of(page, size)));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<BookingDTO>> getMyBookings(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(principal.getName(), PageRequest.of(page, size)));
    }

    @GetMapping("/managed")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Page<BookingDTO>> getManagedBookings(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(bookingService.getBookingsForManager(principal.getName(), PageRequest.of(page, size)));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/refund")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> respondToRefund(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> payload,
            Principal principal) {
        String response = (String) payload.get("cancellationResponse");
        boolean approved = (Boolean) payload.get("approved");
        bookingService.respondToRefundRequest(id, principal.getName(), response, approved);
        return ResponseEntity.ok(Map.of("message", "Refund response processed."));
    }
}
