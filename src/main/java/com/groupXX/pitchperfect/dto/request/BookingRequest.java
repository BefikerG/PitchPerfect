package com.groupXX.pitchperfect.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public record BookingRequest(
    @NotNull(message = "Pitch ID is required")
    Long pitchId,
    
    // Note: Once we add Spring Security in Phase 3, this will be extracted from the JWT token. 
    // For now, we accept it in the JSON payload to test the business logic.
    @NotNull(message = "User ID is required")
    Long userId,

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    LocalDateTime startTime,

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    LocalDateTime endTime
) {}