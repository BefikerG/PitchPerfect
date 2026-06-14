package com.groupXX.pitchperfect.controller;

import java.math.BigDecimal;
import java.security.Principal;

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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<PitchDTO> createPitch(@Valid @RequestBody PitchCreateRequest request, Principal principal) {
        PitchDTO createdPitch = pitchService.createPitch(request, principal.getName());
        return new ResponseEntity<>(createdPitch, HttpStatus.CREATED);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> deletePitch(@org.springframework.web.bind.annotation.PathVariable Long id, Principal principal) {
        pitchService.deletePitch(id, principal.getName());
        return ResponseEntity.ok(java.util.Map.of("message", "Pitch deleted successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/availability")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> toggleAvailability(@org.springframework.web.bind.annotation.PathVariable Long id, Principal principal) {
        pitchService.toggleAvailability(id, principal.getName());
        return ResponseEntity.ok(java.util.Map.of("message", "Pitch availability toggled successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/price")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> updatePrice(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody java.util.Map<String, java.math.BigDecimal> request,
            Principal principal) {
        pitchService.updatePrice(id, request.get("price"), principal.getName());
        return ResponseEntity.ok(java.util.Map.of("message", "Pitch price updated successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<PitchDTO> updatePitch(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @Valid @RequestBody PitchCreateRequest request,
            Principal principal) {
        PitchDTO updatedPitch = pitchService.updatePitch(id, request, principal.getName());
        return ResponseEntity.ok(updatedPitch);
    }

    @GetMapping
    public ResponseEntity<Page<PitchDTO>> getAllPitches(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<PitchDTO> pitches = pitchService.getAllPitches(PageRequest.of(page, size));
        return ResponseEntity.ok(pitches);
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
