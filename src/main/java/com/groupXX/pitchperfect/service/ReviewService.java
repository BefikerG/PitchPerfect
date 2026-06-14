package com.groupXX.pitchperfect.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.dto.request.ReviewRequest;
import com.groupXX.pitchperfect.dto.response.ReviewDTO;
import com.groupXX.pitchperfect.exception.ResourceNotFoundException;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.Review;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.ReviewRepository;
import com.groupXX.pitchperfect.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PitchRepository pitchRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long createReview(String userEmail, ReviewRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pitch pitch = pitchRepository.findById(request.pitchId())
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));

        if (reviewRepository.existsByUserIdAndPitchId(user.getId(), pitch.getId())) {
            throw new IllegalStateException("You have already reviewed this pitch.");
        }

        Review review = Review.builder()
                .user(user)
                .pitch(pitch)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        return reviewRepository.save(review).getId();
    }

    @Transactional(readOnly = true)
    public Page<ReviewDTO> getReviewsForPitch(Long pitchId, Pageable pageable) {
        return reviewRepository.findByPitchId(pitchId, pageable).map(this::mapToDTO);
    }

    private ReviewDTO mapToDTO(Review review) {
        return new ReviewDTO(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFirstName(),
                review.getUser().getLastName(),
                review.getPitch().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
