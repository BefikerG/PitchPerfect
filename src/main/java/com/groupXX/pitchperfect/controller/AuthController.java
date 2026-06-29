package com.groupXX.pitchperfect.controller;

import com.groupXX.pitchperfect.dto.request.LoginRequest;
import com.groupXX.pitchperfect.dto.request.RegisterRequest;
import com.groupXX.pitchperfect.dto.response.TokenResponse;
import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.repository.UserRepository;
import com.groupXX.pitchperfect.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "https://pitch-perfect-theta.vercel.app"})
// IDE force refresh
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody RegisterRequest request) {
        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(request.email());
        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            user.setFirstName(request.firstName());
            user.setLastName(request.lastName());
            user.setUsername(request.username());
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        } else {
            user = User.builder()
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .email(request.email())
                    .username(request.username())
                    .passwordHash(passwordEncoder.encode(request.password()))
                    .role(User.Role.CUSTOMER) // Default role
                    .build();
        }
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return new ResponseEntity<>(new TokenResponse(jwtToken), HttpStatus.CREATED);
    }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        boolean exists = userRepository.existsByUsername(username);
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new TokenResponse(jwtToken));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new com.groupXX.pitchperfect.exception.ResourceNotFoundException("User not found"));
        
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "email", user.getEmail(),
                "username", user.getUsername() != null ? user.getUsername() : "",
                "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "",
                "role", user.getRole().name()
        ));
    }
}
