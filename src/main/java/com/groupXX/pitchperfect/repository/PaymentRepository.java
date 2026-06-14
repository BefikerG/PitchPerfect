package com.groupXX.pitchperfect.repository;

import com.groupXX.pitchperfect.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    @Query("SELECT SUM(p.amount) FROM Payment p")
    BigDecimal sumTotalRevenue();

    java.util.Optional<Payment> findByBookingId(Long bookingId);
}
