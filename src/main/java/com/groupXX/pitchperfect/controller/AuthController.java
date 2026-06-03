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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@SuppressWarnings("null")
// IDE force refresh
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody RegisterRequest request) {
        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(User.Role.CUSTOMER) // Default role
                .build();
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtUtil.generateToken(userDetails);
        
        return new ResponseEntity<>(new TokenResponse(jwtToken), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());
        String jwtToken = jwtUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(new TokenResponse(jwtToken));
    }
}