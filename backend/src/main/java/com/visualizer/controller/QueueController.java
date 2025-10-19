package com.visualizer.controller;

import com.visualizer.model.FileQueue;
import com.visualizer.model.StoredFile;
import com.visualizer.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QueueController {
    
    private final FileStorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private FileQueue fileQueue = new FileQueue(10);
    
    @PostMapping("/enqueue")
    public ResponseEntity<Map<String, Object>> enqueueFile(@RequestParam("file") MultipartFile file) {
                try {
            StoredFile storedFile = storageService.storeFileOnly(file);
            List<FileQueue.VisualizationStep> steps = fileQueue.enqueue(storedFile);
            
            animateSteps(steps, "/topic/queue-visualization");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Enqueue started",
                "steps", steps.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/dequeue")
    public ResponseEntity<Map<String, Object>> dequeueFile() {
        try {
            List<FileQueue.VisualizationStep> steps = fileQueue.dequeue();
            animateSteps(steps, "/topic/queue-visualization");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/peek")
    public ResponseEntity<Map<String, Object>> peekFile() {
        try {
            List<FileQueue.VisualizationStep> steps = fileQueue.peek();
            animateSteps(steps, "/topic/queue-visualization");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(Map.of(
            "size", fileQueue.getSize(),
            "maxSize", fileQueue.getMaxSize(),
            "isEmpty", fileQueue.isEmpty(),
            "isFull", fileQueue.isFull(),
            "files", fileQueue.getAllFiles()
        ));
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearQueue() {
        fileQueue = new FileQueue(10);
        return ResponseEntity.ok(Map.of("success", true, "message", "Queue cleared"));
    }
    
    private void animateSteps(List<FileQueue.VisualizationStep> steps, String topic) {
        new Thread(() -> {
            try {
                for (int i = 0; i < steps.size(); i++) {
                    FileQueue.VisualizationStep step = steps.get(i);
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