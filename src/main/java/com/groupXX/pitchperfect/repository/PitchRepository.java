package com.groupXX.pitchperfect.repository;

import com.groupXX.pitchperfect.model.Pitch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface PitchRepository extends JpaRepository<Pitch, Long> {

    // Custom query for Requirement F9: Search/filter endpoint with multiple
    // parameters
    @Query("SELECT p FROM Pitch p WHERE " +
            "LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%')) " +
            "AND p.pricePerHour <= :maxPrice " +
            "AND p.isAvailable = true")
    Page<Pitch> findAvailablePitchesByLocationAndPrice(
            @Param("location") String location,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT p FROM Pitch p WHERE " +
            "LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%')) " +
            "AND p.pricePerHour <= :maxPrice " +
            "AND p.isAvailable = true " +
            "AND NOT EXISTS (" +
            "   SELECT 1 FROM Booking b WHERE b.pitch = p " +
            "   AND b.status = 'CONFIRMED' " +
            "   AND (b.startTime < :endTime AND b.endTime > :startTime)" +
            ")")
    Page<Pitch> findAvailablePitchesByLocationPriceAndDate(
            @Param("location") String location,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("startTime") java.time.LocalDateTime startTime,
            @Param("endTime") java.time.LocalDateTime endTime,
            Pageable pageable);
}