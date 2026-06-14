package com.groupXX.pitchperfect.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import com.groupXX.pitchperfect.model.User;
import com.groupXX.pitchperfect.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            Principal principal,
            @RequestBody Map<String, String> updates) {
        
        User user = userService.updateProfile(principal.getName(), updates);
        
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

    @PostMapping("/profile/image")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            Principal principal,
            @RequestParam("file") MultipartFile file) {
        String fileUrl = userService.uploadProfileImage(principal.getName(), file);
        return ResponseEntity.ok(Map.of("profileImageUrl", fileUrl));
    }
}
