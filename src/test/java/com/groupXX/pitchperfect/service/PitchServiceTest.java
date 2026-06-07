package com.groupXX.pitchperfect.service;

import com.groupXX.pitchperfect.dto.request.PitchCreateRequest;
import com.groupXX.pitchperfect.dto.response.PitchDTO;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.repository.PitchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PitchServiceTest {

    @Mock
    private PitchRepository pitchRepository;

    @InjectMocks
    private PitchService pitchService;

    @Test
    void createPitch_ShouldReturnPitchDTO_WhenDataIsValid() {
        // Arrange
        PitchCreateRequest request = new PitchCreateRequest("Stadium A", "Downtown", new BigDecimal("150.00"));
        Pitch savedPitch = Pitch.builder()
                .id(1L)
                .name("Stadium A")
                .location("Downtown")
                .pricePerHour(new BigDecimal("150.00"))
                .isAvailable(true)
                .build();

        when(pitchRepository.save(any(Pitch.class))).thenReturn(savedPitch);

        // Act
        PitchDTO result = pitchService.createPitch(request);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Stadium A", result.name());
        assertEquals(new BigDecimal("150.00"), result.pricePerHour());
        assertTrue(result.isAvailable());
        verify(pitchRepository, times(1)).save(any(Pitch.class));
    }
}