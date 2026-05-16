package com.groupXX.pitchperfect.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, String> validationErrors // Specifically for Requirement F7 (Bean Validation)
) {}

