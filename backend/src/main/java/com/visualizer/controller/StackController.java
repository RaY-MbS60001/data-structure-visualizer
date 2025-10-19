package com.visualizer.controller;

import com.visualizer.model.FileStack;
import com.visualizer.model.StoredFile;
import com.visualizer.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/stack")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StackController {
    
    private final FileStorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private FileStack fileStack = new FileStack(10);
    
    @PostMapping("/push")
    public ResponseEntity<Map<String, Object>> pushFile(@RequestParam("file") MultipartFile file) {
        try {
            StoredFile storedFile = storageService.storeFileOnly(file);
            List<FileStack.VisualizationStep> steps = fileStack.push(storedFile);
            
            animateSteps(steps, "/topic/stack-visualization");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Push started",
                "steps", steps.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/pop")
    public ResponseEntity<Map<String, Object>> popFile() {
        try {
            List<FileStack.VisualizationStep> steps = fileStack.pop();
            animateSteps(steps, "/topic/stack-visualization");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/peek")
    public ResponseEntity<Map<String, Object>> peekFile() {
        try {
            List<FileStack.VisualizationStep> steps = fileStack.peek();
            animateSteps(steps, "/topic/stack-visualization");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(Map.of(
            "size", fileStack.getSize(),
            "maxSize", fileStack.getMaxSize(),
            "isEmpty", fileStack.isEmpty(),
            "isFull", fileStack.isFull(),
            "files", fileStack.getAllFiles()
        ));
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearStack() {
        fileStack = new FileStack(10);
        return ResponseEntity.ok(Map.of("success", true, "message", "Stack cleared"));
    }
    
    private void animateSteps(List<FileStack.VisualizationStep> steps, String topic) {
        new Thread(() -> {
            try {
                for (int i = 0; i < steps.size(); i++) {
                    FileStack.VisualizationStep step = steps.get(i);
                    Map<String, Object> message = Map.of(
                        "stepNumber", i + 1,
                        "totalSteps", steps.size(),
                        "operation", step.getOperation(),
                        "description", step.getDescription(),
                        "nodes", step.getCurrentState(),
                        "highlightedNodeId", step.getHighlightedNodeId() != null ? step.getHighlightedNodeId() : "",
                        "metadata", step.getMetadata()
                    );
                    messagingTemplate.convertAndSend(topic, message);
                    Thread.sleep(800);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}