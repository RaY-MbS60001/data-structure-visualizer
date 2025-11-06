package com.visualizer.controller;

import com.visualizer.model.FileArray;
import com.visualizer.model.StoredFile;
import com.visualizer.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/array")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ArrayController {

    private final FileStorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private FileArray fileArray = new FileArray(10);

    @PostMapping("/insert")
    public ResponseEntity<Map<String, Object>> insertFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "0") int index) {

        try {
            StoredFile stored = storageService.storeFileOnly(file);
            List<FileArray.VisualizationStep> steps = fileArray.insert(stored, index);
            animateSteps(steps, "/topic/array-visualization");
            return ResponseEntity.ok(Map.of("success", true, "message", "Insert started"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, Object>> deleteElement(@RequestParam int index) {
        List<FileArray.VisualizationStep> steps = fileArray.delete(index);
        animateSteps(steps, "/topic/array-visualization");
        return ResponseEntity.ok(Map.of("success", true, "message", "Delete started"));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam String filename) {
        List<FileArray.VisualizationStep> steps = fileArray.search(filename);
        animateSteps(steps, "/topic/array-visualization");
        return ResponseEntity.ok(Map.of("success", true, "message", "Search started"));
    }

    @GetMapping("/access")
    public ResponseEntity<Map<String, Object>> access(@RequestParam int index) {
        List<FileArray.VisualizationStep> steps = fileArray.access(index);
        animateSteps(steps, "/topic/array-visualization");
        return ResponseEntity.ok(Map.of("success", true, "message", "Access started"));
    }

    @PostMapping("/resize")
    public ResponseEntity<Map<String, Object>> resize(@RequestParam int capacity) {
        fileArray.resize(capacity);
        return ResponseEntity.ok(Map.of("success", true, "capacity", capacity));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearArray() {
        fileArray.clear();
        return ResponseEntity.ok(Map.of("success", true, "message", "Array cleared"));
    }

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> state() {
        return ResponseEntity.ok(Map.of(
            "size", fileArray.getSize(),
            "capacity", fileArray.getCapacity(),
            "isEmpty", fileArray.isEmpty(),
            "files", fileArray.getAllFiles()
        ));
    }

    private void animateSteps(List<FileArray.VisualizationStep> steps, String topic) {
        new Thread(() -> {
            try {
                for (int i = 0; i < steps.size(); i++) {
                    FileArray.VisualizationStep step = steps.get(i);
                    Map<String, Object> msg = Map.of(
                        "stepNumber", i + 1,
                        "totalSteps", steps.size(),
                        "operation", step.getOperation(),
                        "description", step.getDescription(),
                        "elements", step.getCurrentState(),
                        "highlightedElementId", step.getHighlightedElementId() != null ? step.getHighlightedElementId() : "",
                        "metadata", step.getMetadata()
                    );
                    messagingTemplate.convertAndSend(topic, msg);
                    Thread.sleep(700);
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }
}