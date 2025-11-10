package com.visualizer.controller;

import com.visualizer.model.*;
import com.visualizer.service.AlgorithmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.messaging.handler.annotation.SendTo;

@RestController
@RequestMapping("/api/algorithm")
@CrossOrigin(origins = "*")
public class AlgorithmController {
    
    @Autowired
    private AlgorithmService algorithmService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @PostMapping("/sort")
    public Map<String, Object> sort(@RequestBody Map<String, Object> request) {
        String algorithm = (String) request.get("algorithm");
        List<Integer> array = (List<Integer>) request.get("array");
        
        List<Map<String, Object>> steps = algorithmService.sort(algorithm, array);
        
        return Map.of(
            "algorithm", algorithm,
            "steps", steps,
            "finalArray", array
        );
    }
    
    @PostMapping("/search")
    public Map<String, Object> search(@RequestBody Map<String, Object> request) {
        String algorithm = (String) request.get("algorithm");
        List<Integer> array = (List<Integer>) request.get("array");
        int target = (int) request.get("target");
        
        Map<String, Object> result = algorithmService.search(algorithm, array, target);
        
        return result;
    }
    
    @PostMapping("/traverse")
    public Map<String, Object> traverse(@RequestBody Map<String, Object> request) {
        String algorithm = (String) request.get("algorithm");
        String structure = (String) request.get("structure");
        Map<String, Object> data = (Map<String, Object>) request.get("data");
        
        List<String> traversalOrder = algorithmService.traverse(algorithm, structure, data);
        
        // Broadcast steps
        for (int i = 0; i < traversalOrder.size(); i++) {
            final int step = i;
            messagingTemplate.convertAndSend("/topic/traversal", Map.of(
                "step", step,
                "nodeId", traversalOrder.get(i),
                "totalSteps", traversalOrder.size()
            ));
        }
        
        return Map.of(
            "algorithm", algorithm,
            "traversalOrder", traversalOrder
        );
    }
    
    @MessageMapping("/algorithm/step")
    @SendTo("/topic/algorithm/updates")
    public Map<String, Object> broadcastStep(Map<String, Object> step) {
        return step;
    }
}