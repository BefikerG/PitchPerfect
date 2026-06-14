package com.groupXX.pitchperfect.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pitches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pitch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(name = "price_per_hour", nullable = false)
    private BigDecimal pricePerHour;

    @Builder.Default
    @Column(name = "is_available")
    private boolean isAvailable = true;

    @Column(name = "image_url")
    private String imageUrl;

    // Multiple images stored as comma-separated URLs
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}