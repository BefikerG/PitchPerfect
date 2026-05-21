package com.groupXX.pitchperfect.service;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.groupXX.pitchperfect.dto.request.PitchCreateRequest;
import com.groupXX.pitchperfect.dto.response.PitchDTO;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.repository.PitchRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PitchService {

    private final PitchRepository pitchRepository;

    @Transactional
    public PitchDTO createPitch(PitchCreateRequest request) {
        Pitch pitch = Pitch.builder()
                .name(request.name())
                .location(request.location())
                .pricePerHour(request.pricePerHour())
                .isAvailable(true)
                .build();
        
        Pitch savedPitch = pitchRepository.save(pitch);
        return mapToDTO(savedPitch);
    }

    @Transactional(readOnly = true)
    public Page<PitchDTO> searchAvailablePitches(String location, BigDecimal maxPrice, Pageable pageable) {
        return pitchRepository.findAvailablePitchesByLocationAndPrice(location, maxPrice, pageable)
                .map(this::mapToDTO);
    }

    private PitchDTO mapToDTO(Pitch pitch) {
        return new PitchDTO(pitch.getId(), pitch.getName(), pitch.getLocation(),
                pitch.getPricePerHour(), pitch.isAvailable(), pitch.getCreatedAt());
    }
}

