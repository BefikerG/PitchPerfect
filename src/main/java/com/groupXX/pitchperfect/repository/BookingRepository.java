package com.groupXX.pitchperfect.repository;

import java.time.LocalDateTime;
import java.util.Optional;

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

    // Find the soonest end_time for an active booking on a pitch (next available slot)
    @Query("SELECT MIN(b.endTime) FROM Booking b WHERE b.pitch.id = :pitchId " +
           "AND b.status = 'CONFIRMED' AND b.endTime > :after")
    Optional<LocalDateTime> findNextAvailableTime(@Param("pitchId") Long pitchId,
                                                   @Param("after") LocalDateTime after);

    // Find the end time of the current active booking (if any)
    @Query("SELECT MAX(b.endTime) FROM Booking b WHERE b.pitch.id = :pitchId " +
           "AND b.status = 'CONFIRMED' AND b.startTime <= :now AND b.endTime > :now")
    Optional<LocalDateTime> findCurrentActiveBookingEndTime(@Param("pitchId") Long pitchId,
                                                            @Param("now") LocalDateTime now);

    @Query("SELECT MIN(b.startTime) FROM Booking b WHERE b.pitch.id = :pitchId " +
           "AND b.status = 'CONFIRMED' AND b.startTime > :now")
    Optional<LocalDateTime> findNextUpcomingBookingStartTime(@Param("pitchId") Long pitchId,
                                                             @Param("now") LocalDateTime now);

    org.springframework.data.domain.Page<Booking> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);

    java.util.List<Booking> findAllByUserId(Long userId);

    @Query("SELECT b FROM Booking b WHERE b.pitch.manager.id = :managerId")
    org.springframework.data.domain.Page<Booking> findByPitchManagerId(@Param("managerId") Long managerId, org.springframework.data.domain.Pageable pageable);
}
