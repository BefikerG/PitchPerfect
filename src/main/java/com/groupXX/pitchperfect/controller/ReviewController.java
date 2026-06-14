package com.groupXX.pitchperfect.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.groupXX.pitchperfect.dto.request.ReviewRequest;
import com.groupXX.pitchperfect.dto.response.ReviewDTO;
import com.groupXX.pitchperfect.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReview(
            @Valid @RequestBody ReviewRequest request,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "You must be logged in to leave a review."));
        }

        Long reviewId = reviewService.createReview(principal.getName(), request);

        return new ResponseEntity<>(Map.of(
                "message", "Review submitted successfully",
                "reviewId", reviewId
        ), HttpStatus.CREATED);
    }

    @GetMapping("/pitch/{pitchId}")
    public ResponseEntity<Page<ReviewDTO>> getReviewsForPitch(
            @PathVariable Long pitchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviewsForPitch(pitchId, PageRequest.of(page, size)));
    }
}
