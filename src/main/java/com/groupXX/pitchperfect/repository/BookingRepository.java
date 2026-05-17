package com.groupXX.pitchperfect.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.groupXX.pitchperfect.model.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // The Conflict Engine Query: Checks if any CONFIRMED booking overlaps with the requested times
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.pitch.id = :pitchId " +
           "AND b.status = 'CONFIRMED' " +
           "AND (b.startTime < :endTime AND b.endTime > :startTime)")
    long countConflictingBookings(@Param("pitchId") Long pitchId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);
}

