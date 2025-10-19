package com.visualizer.controller;

import com.visualizer.model.FileLinkedList;
import com.visualizer.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileStorageController {
    
    private final FileStorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Store file and get visualization steps
            List<FileLinkedList.VisualizationStep> steps = storageService.storeFile(file);
            
            // Send steps via WebSocket with animation delay
            new Thread(() -> {
                try {
                    for (int i = 0; i < steps.size(); i++) {
                        FileLinkedList.VisualizationStep step = steps.get(i);
                        
                        Map<String, Object> message = new HashMap<>();
                        message.put("stepNumber", i + 1);
                        message.put("totalSteps", steps.size());
                        message.put("operation", step.getOperation());
                        message.put("description", step.getDescription());
                        message.put("nodes", step.getCurrentState());
                        message.put("highlightedNodeId", step.getHighlightedNodeId());
                        message.put("metadata", step.getMetadata());
                        
                        messagingTemplate.convertAndSend("/topic/visualization", message);
                        
                        // Animation delay based on operation type
                        int delay = getDelayForOperation(step.getOperation());
                        Thread.sleep(delay);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "File uploaded! Watch the visualization.",
                "filename", file.getOriginalFilename(),
                "steps", steps.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Upload failed: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFile(
            @RequestParam("filename") String filename) {
        
        try {
            List<FileLinkedList.VisualizationStep> steps = storageService.searchFile(filename);
            
            // Animate search process
            new Thread(() -> {
                try {
                    for (FileLinkedList.VisualizationStep step : steps) {
                        Map<String, Object> message = new HashMap<>();
                        message.put("operation", step.getOperation());
                        message.put("description", step.getDescription());
                        message.put("nodes", step.getCurrentState());
                        message.put("highlightedNodeId", step.getHighlightedNodeId());
                        message.put("metadata", step.getMetadata());
                        
                        messagingTemplate.convertAndSend("/topic/visualization", message);
                        
                        int delay = getDelayForOperation(step.getOperation());
                        Thread.sleep(delay);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Search started for: " + filename,
                "steps", steps.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Search failed: " + e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @RequestParam("filename") String filename) {
        
        try {
            List<FileLinkedList.VisualizationStep> steps = storageService.deleteFile(filename);
            
            // Animate deletion
            new Thread(() -> {
                try {
                    for (FileLinkedList.VisualizationStep step : steps) {
                        Map<String, Object> message = new HashMap<>();
                        message.put("operation", step.getOperation());
                        message.put("description", step.getDescription());
                        message.put("nodes", step.getCurrentState());
                        message.put("highlightedNodeId", step.getHighlightedNodeId());
                        message.put("metadata", step.getMetadata());
                        
                        messagingTemplate.convertAndSend("/topic/visualization", message);
                        
                        int delay = getDelayForOperation(step.getOperation());
                        Thread.sleep(delay);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }).start();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Deletion started for: " + filename,
                "steps", steps.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Delete failed: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getCurrentState() {
        return ResponseEntity.ok(storageService.getCurrentVisualizationState());
    }
    
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listAllFiles() {
        return ResponseEntity.ok(Map.of(
            "files", storageService.getAllFiles()
        ));
    }
    
    // Helper method to determine animation delays
    private int getDelayForOperation(String operation) {
        return switch (operation) {
            case "CREATE_NODE" -> 1000;
            case "TRAVERSE" -> 600;
            case "COMPARE" -> 700;
            case "LINK_NODE", "RELINK" -> 900;
            case "FOUND", "FOUND_TARGET" -> 1200;
            case "COMPLETE" -> 1500;
            default -> 800;
        };
    }
}