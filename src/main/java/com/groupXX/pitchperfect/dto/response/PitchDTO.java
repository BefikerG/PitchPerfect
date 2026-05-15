package com.groupXX.pitchperfect.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PitchDTO(
        Long id,
        String name,
        String location,
        BigDecimal pricePerHour,
        boolean isAvailable,
        LocalDateTime createdAt) {
}