package com.groupXX.pitchperfect.controller;

import com.groupXX.pitchperfect.service.PitchService;
import com.groupXX.pitchperfect.security.JwtUtil;
import com.groupXX.pitchperfect.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PitchController.class)
@AutoConfigureMockMvc(addFilters = false) // Bypasses the actual JWT filter for pure controller testing
class PitchControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private PitchService pitchService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(roles = "MANAGER")
    void createPitch_ShouldReturn201_WhenRequestIsValid() throws Exception {
        String jsonRequest = """
                {
                    "name": "Stadium A",
                    "location": "Downtown",
                    "pricePerHour": 150.00
                }
                """;

        mockMvc.perform(post("/api/v1/pitches")
                .principal(() -> "manager@test.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonRequest))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createPitch_ShouldReturn400_WhenPriceIsNegative() throws Exception {
        // This tests our GlobalExceptionHandler and @Positive bean validation
        String invalidJson = """
                {
                    "name": "Stadium A",
                    "location": "Downtown",
                    "pricePerHour": -50.00
                }
                """;

        mockMvc.perform(post("/api/v1/pitches")
                .principal(() -> "manager@test.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}