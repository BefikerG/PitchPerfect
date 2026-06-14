package com.groupXX.pitchperfect.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.exception.ResourceNotFoundException;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.model.Booking;
import com.groupXX.pitchperfect.repository.BookingRepository;
import com.groupXX.pitchperfect.repository.PaymentRepository;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @Value("${app.super-admin-email}")
    private String superAdminEmail;

    @Transactional(readOnly = true)
    public Map<String, Object> getPlatformStats() {
        BigDecimal totalRevenue = paymentRepository.sumTotalRevenue();
        return Map.of(
                "totalUsers", userRepository.count(),
                "totalPitches", pitchRepository.count(),
                "totalBookings", bookingRepository.count(),
                "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO
        );
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(user -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", user.getId());
            map.put("firstName", user.getFirstName());
            map.put("lastName", user.getLastName());
            map.put("email", user.getEmail());
            map.put("role", user.getRole().name());
            map.put("banned", user.isBanned());
            map.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            return map;
        });
    }

    /**
     * Returns all users with the MANAGER role — used by Admin to populate the
     * "Assign Manager" dropdown in the UI.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllManagers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.MANAGER)
                .map(u -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", u.getId());
                    m.put("firstName", u.getFirstName());
                    m.put("lastName", u.getLastName());
                    m.put("email", u.getEmail());
                    return m;
                })
                .toList();
    }

    @Transactional
    public void toggleUserBan(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalStateException("Cannot ban an admin user.");
        }
        user.setBanned(!user.isBanned());
        userRepository.save(user);
    }

    /**
     * Updates a user's role.
     * Only the Super Admin (configured via app.super-admin-email) can demote
     * another ADMIN. Regular admins can promote/demote CUSTOMER <-> MANAGER only.
     *
     * @param requesterEmail the email of the admin performing the action
     */
    @Transactional
    public void updateUserRole(Long userId, String newRoleStr, String requesterEmail) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            User.Role newRole = User.Role.valueOf(newRoleStr.toUpperCase());

            // If the target is currently an ADMIN, only the Super Admin can change their role
            if (target.getRole() == User.Role.ADMIN) {
                if (superAdminEmail == null || !superAdminEmail.trim().equalsIgnoreCase(requesterEmail.trim())) {
                    throw new IllegalStateException(
                            "Only the Super Admin can demote or change the role of another Admin.");
                }
            }

            // Nobody can self-demote through this endpoint
            if (target.getEmail().equalsIgnoreCase(requesterEmail)) {
                throw new IllegalStateException("You cannot change your own role.");
            }

            target.setRole(newRole);
            userRepository.save(target);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role specified: " + newRoleStr);
        }
    }

    /**
     * Assigns (or unassigns) a manager to a specific pitch.
     */
    @Transactional
    public void assignPitchManager(Long pitchId, Long managerId) {
        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() -> new ResourceNotFoundException("Pitch not found"));

        if (managerId == null) {
            pitch.setManager(null);
        } else {
            User manager = userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            if (manager.getRole() != User.Role.MANAGER && manager.getRole() != User.Role.ADMIN) {
                throw new IllegalStateException("User is not a Manager.");
            }
            pitch.setManager(manager);
        }
        pitchRepository.save(pitch);
    }

    /**
     * Gets detailed profile statistics for a user.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserProfileStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == User.Role.CUSTOMER) {
            // Get booking stats
            List<Booking> bookings = bookingRepository.findAllByUserId(userId);
            long totalBookings = bookings.size();
            java.math.BigDecimal totalSpent = bookings.stream()
                    .filter(b -> b.getStatus() == Booking.Status.CONFIRMED)
                    .map(b -> {
                        long minutes = java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes();
                        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
                        return b.getPitch().getPricePerHour().multiply(hours);
                    })
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            
            return Map.of(
                "role", "CUSTOMER",
                "totalBookings", totalBookings,
                "totalSpent", totalSpent,
                "completedBookings", bookings.stream().filter(b -> b.getStatus() == Booking.Status.CONFIRMED).count()
            );
        } else {
            // MANAGER or ADMIN
            List<Pitch> managedPitches = pitchRepository.findAll().stream()
                    .filter(p -> p.getManager() != null && p.getManager().getId().equals(userId))
                    .toList();
            List<Pitch> createdPitches = pitchRepository.findAll().stream()
                    .filter(p -> p.getCreatedBy() != null && p.getCreatedBy().getId().equals(userId))
                    .toList();
            
            return Map.of(
                "role", user.getRole().name(),
                "managedPitchesCount", managedPitches.size(),
                "createdPitchesCount", createdPitches.size()
            );
        }
    }
}
