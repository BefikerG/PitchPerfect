package com.groupXX.pitchperfect.dto.response;

import java.time.LocalDateTime;

public record BookingDTO(
        Long id,
        Long userId,
        String userEmail,
        String userFullName,
        Long pitchId,
        String pitchName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        LocalDateTime createdAt,
        java.math.BigDecimal totalAmount,
        String cancellationReason,
        String cancellationResponse,
        String cancellationRefundStatus) {
}
