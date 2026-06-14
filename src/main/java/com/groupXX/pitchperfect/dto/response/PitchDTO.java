package com.groupXX.pitchperfect.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PitchDTO(
        Long id,
        String name,
        String location,
        BigDecimal pricePerHour,
        boolean isAvailable,
        String imageUrl,
        List<String> imageUrls,
        LocalDateTime createdAt,
        LocalDateTime currentBookingEndTime,
        LocalDateTime nextBookingStartTime,
        Long managerId,
        String createdByName) {
}