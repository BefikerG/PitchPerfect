package com.groupXX.pitchperfect.controller;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.groupXX.pitchperfect.dto.request.PitchCreateRequest;
import com.groupXX.pitchperfect.dto.response.PitchDTO;
import com.groupXX.pitchperfect.service.PitchService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/pitches")
@RequiredArgsConstructor
public class PitchController {

    private final PitchService pitchService;

    @PostMapping
    public ResponseEntity<PitchDTO> createPitch(@Valid @RequestBody PitchCreateRequest request) {
        PitchDTO createdPitch = pitchService.createPitch(request);
        return new ResponseEntity<>(createdPitch, HttpStatus.CREATED);
    }

    // Satisfies Requirement F9: Search/filter endpoint with multiple parameters
    @GetMapping("/search")
    public ResponseEntity<Page<PitchDTO>> searchPitches(
            @RequestParam(required = false, defaultValue = "") String location,
            @RequestParam(required = false, defaultValue = "99999.00") BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<PitchDTO> pitches = pitchService.searchAvailablePitches(location, maxPrice, PageRequest.of(page, size));
        return ResponseEntity.ok(pitches);
    }
}
