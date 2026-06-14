package com.groupXX.pitchperfect.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PitchCreateRequest(
        @NotBlank(message = "Pitch name is required") String name,

        @NotBlank(message = "Location is required") String location,

        @NotNull(message = "Price per hour is required") @Positive(message = "Price must be greater than zero") BigDecimal pricePerHour,
        
        String imageUrl,
        
        List<String> imageUrls,
        
        Long managerId) {
}