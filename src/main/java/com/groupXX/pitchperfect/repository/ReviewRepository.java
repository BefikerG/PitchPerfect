package com.groupXX.pitchperfect.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.groupXX.pitchperfect.model.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByPitchId(Long pitchId, Pageable pageable);
    boolean existsByUserIdAndPitchId(Long userId, Long pitchId);
}
