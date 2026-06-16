package com.groupXX.pitchperfect.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record BookingRequest(
    @NotNull(message = "Pitch ID is required")
    Long pitchId,

    // userId is now extracted from the JWT token via Principal — no longer accepted in body
    @NotNull(message = "Start time is required")
    LocalDateTime startTime,

    @NotNull(message = "End time is required")
    LocalDateTime endTime
) {}