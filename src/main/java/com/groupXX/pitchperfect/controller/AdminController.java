package com.groupXX.pitchperfect.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.groupXX.pitchperfect.service.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<Map<String, Object>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getAllUsers(PageRequest.of(page, size)));
    }

    /** Returns all MANAGER-role users — used to populate the "Assign Manager" dropdown */
    @GetMapping("/managers")
    public ResponseEntity<List<Map<String, Object>>> getManagers() {
        return ResponseEntity.ok(adminService.getAllManagers());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<Map<String, String>> toggleUserBan(@PathVariable Long id) {
        adminService.toggleUserBan(id);
        return ResponseEntity.ok(Map.of("message", "User ban status toggled successfully"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Principal principal) {
        String newRole = request.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
        }
        adminService.updateUserRole(id, newRole, principal.getName());
        return ResponseEntity.ok(Map.of("message", "User role updated successfully"));
    }

    /** Assigns (or unassigns) a manager to a specific pitch */
    @PutMapping("/pitches/{pitchId}/manager")
    public ResponseEntity<Map<String, String>> assignPitchManager(
            @PathVariable Long pitchId,
            @RequestBody Map<String, Object> request) {
        Object managerIdObj = request.get("managerId");
        Long managerId = managerIdObj != null && !managerIdObj.toString().isBlank()
                ? Long.parseLong(managerIdObj.toString())
                : null;
        adminService.assignPitchManager(pitchId, managerId);
        return ResponseEntity.ok(Map.of("message", "Pitch manager assigned successfully"));
    }

    @GetMapping("/users/{id}/stats")
    public ResponseEntity<Map<String, Object>> getUserProfileStats(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserProfileStats(id));
    }
}
