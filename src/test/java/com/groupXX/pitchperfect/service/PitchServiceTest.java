package com.groupXX.pitchperfect.service;

import com.groupXX.pitchperfect.dto.request.PitchCreateRequest;
import com.groupXX.pitchperfect.dto.response.PitchDTO;
import com.groupXX.pitchperfect.model.Pitch;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.PitchRepository;
import com.groupXX.pitchperfect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PitchServiceTest {

    @Mock
    private PitchRepository pitchRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PitchService pitchService;

    @Test
    void createPitch_ShouldReturnPitchDTO_WhenDataIsValid() {
        // Arrange
        PitchCreateRequest request = new PitchCreateRequest("Stadium A", "Downtown", new BigDecimal("150.00"), "http://image.com/pic.jpg", null, null);
        User manager = User.builder().id(1L).email("manager@test.com").build();
        
        Pitch savedPitch = Pitch.builder()
                .id(1L)
                .name("Stadium A")
                .location("Downtown")
                .pricePerHour(new BigDecimal("150.00"))
                .isAvailable(true)
                .imageUrl("http://image.com/pic.jpg")
                .manager(manager)
                .build();

        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));
        when(pitchRepository.save(any(Pitch.class))).thenReturn(savedPitch);

        // Act
        PitchDTO result = pitchService.createPitch(request, "manager@test.com");

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Stadium A", result.name());
        assertEquals(new BigDecimal("150.00"), result.pricePerHour());
        assertTrue(result.isAvailable());
        verify(pitchRepository, times(1)).save(any(Pitch.class));
    }
}