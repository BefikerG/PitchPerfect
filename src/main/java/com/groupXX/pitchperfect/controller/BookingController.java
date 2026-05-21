package com.groupXX.pitchperfect.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.groupXX.pitchperfect.dto.request.BookingRequest;
import com.groupXX.pitchperfect.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(@Valid @RequestBody BookingRequest request) {
        Long bookingId = bookingService.createBooking(
                request.userId(),
                request.pitchId(),
                request.startTime(),
                request.endTime()
        );
        
        return new ResponseEntity<>(Map.of(
                "message", "Booking confirmed successfully",
                "bookingId", bookingId
        ), HttpStatus.CREATED);
    }
}

