package com.visualizer.controller;

import com.visualizer.model.FileBinaryTree;
import com.visualizer.model.StoredFile;
import com.visualizer.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/tree")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TreeController {
    
    private final FileStorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private FileBinaryTree binaryTree = new FileBinaryTree();
    
    @PostMapping("/insert")
    public ResponseEntity<Map<String, Object>> insertFile(@RequestParam("file") MultipartFile file) {
        try {
            StoredFile storedFile = storageService.storeFileOnly(file);
            List<FileBinaryTree.VisualizationStep> steps = binaryTree.insert(storedFile);
            
            animateSteps(steps, "/topic/tree-visualization");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Insert started",
                "steps", steps.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFile(@RequestParam("filename") String filename) {
        try {
            List<FileBinaryTree.VisualizationStep> steps = binaryTree.search(filename);
            animateSteps(steps, "/topic/tree-visualization");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        return ResponseEntity.ok(Map.of(
            "size", binaryTree.getSize(),
            "isEmpty", binaryTree.isEmpty()
        ));
    }
    
    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearTree() {
        binaryTree = new FileBinaryTree();
        return ResponseEntity.ok(Map.of("success", true, "message", "Tree cleared"));
    }
    
    private void animateSteps(List<FileBinaryTree.VisualizationStep> steps, String topic) {
        new Thread(() -> {
            try {
                for (int i = 0; i < steps.size(); i++) {
                    FileBinaryTree.VisualizationStep step = steps.get(i);
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
                    Thread.sleep(900);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}
