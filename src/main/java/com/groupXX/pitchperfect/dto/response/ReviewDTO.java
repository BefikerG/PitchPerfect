package com.groupXX.pitchperfect.dto.response;

import java.time.LocalDateTime;

public record ReviewDTO(
        Long id,
        Long userId,
        String userFirstName,
        String userLastName,
        Long pitchId,
        Integer rating,
        String comment,
        LocalDateTime createdAt) {
}
