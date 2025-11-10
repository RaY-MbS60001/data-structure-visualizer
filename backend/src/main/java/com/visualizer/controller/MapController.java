package com.visualizer.controller;

import com.visualizer.model.*;
import com.visualizer.service.MapService;
import com.visualizer.service.AlgorithmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/map")
@CrossOrigin(origins = "*")
public class MapController {
    
    @Autowired
    private MapService mapService;
    
    @Autowired
    private AlgorithmService algorithmService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @GetMapping("/{province}")
    public Map<String, Object> getMapData(@PathVariable String province) {
        try {
            Graph mapGraph = null;
            
            switch (province.toLowerCase()) {
                case "kzn":
                    mapGraph = mapService.loadKZNMap();
                    break;
                case "gauteng":
                    mapGraph = mapService.loadGautengMap();
                    break;
                default:
                    return Map.of("error", "Invalid province");
            }
            
            return Map.of(
                "province", province,
                "nodes", mapGraph.getNodes(),
                "edges", mapGraph.getEdges()
            );
        } catch (IOException e) {
            return Map.of("error", "Failed to load map data");
        }
    }
    
    @PostMapping("/shortest-path")
    public Map<String, Object> findShortestPath(@RequestBody Map<String, Object> request) {
        String province = (String) request.get("province");
        String start = (String) request.get("start");
        String end = (String) request.get("end");
        String algorithm = (String) request.get("algorithm");
        
        try {
            Graph mapGraph = province.equals("kzn") ? 
                mapService.loadKZNMap() : mapService.loadGautengMap();
            
            List<AlgorithmService.AlgorithmStep> steps = null;
            Map<String, Object> result = new HashMap<>();
            
            switch (algorithm) {
                case "dijkstra":
                    steps = algorithmService.dijkstra(mapGraph, start, end);
                    break;
                case "astar":
                    steps = algorithmService.aStar(mapGraph, start, end);
                    break;
                case "bfs":
                    steps = algorithmService.bfs(mapGraph, start);
                    break;
            }
            
            // Broadcast steps for real-time visualization
            if (steps != null) {
                for (AlgorithmService.AlgorithmStep step : steps) {
                    messagingTemplate.convertAndSend("/topic/pathfinding", step);
                    Thread.sleep(100); // Small delay for visualization
                }
            }
            
            // Extract final path and distance
            List<String> path = extractPath(steps);
            double distance = calculateDistance(mapGraph, path);
            
            result.put("path", path);
            result.put("distance", distance);
            result.put("steps", steps);
            result.put("nodesExplored", countNodesExplored(steps));
            
            return result;
            
        } catch (Exception e) {
            return Map.of("error", "Failed to find path: " + e.getMessage());
        }
    }
    
    @MessageMapping("/pathfinding/route")
    public void handleRouteRequest(Map<String, Object> request) {
        // Broadcast route request to all connected clients
        messagingTemplate.convertAndSend("/topic/pathfinding", Map.of(
            "type", "route_request",
            "data", request
        ));
    }
    
    private List<String> extractPath(List<AlgorithmService.AlgorithmStep> steps) {
        if (steps == null || steps.isEmpty()) return new ArrayList<>();
        
        // Find the final path from algorithm steps
        for (int i = steps.size() - 1; i >= 0; i--) {
            AlgorithmService.AlgorithmStep step = steps.get(i);
            if (step.type.equals("path_found") && step.data.containsKey("path")) {
                return (List<String>) step.data.get("path");
            }
        }
        
        return new ArrayList<>();
    }
    
    private double calculateDistance(Graph graph, List<String> path) {
        double totalDistance = 0;
        
        for (int i = 0; i < path.size() - 1; i++) {
            String from = path.get(i);
            String to = path.get(i + 1);
            
            // Find edge between nodes
            for (Edge edge : graph.getEdges()) {
                if ((edge.getSource().equals(from) && edge.getTarget().equals(to)) ||
                    (edge.getSource().equals(to) && edge.getTarget().equals(from))) {
                    totalDistance += edge.getWeight();
                    break;
                }
            }
        }
        
        return totalDistance;
    }
    
    private int countNodesExplored(List<AlgorithmService.AlgorithmStep> steps) {
        Set<String> exploredNodes = new HashSet<>();
        
        for (AlgorithmService.AlgorithmStep step : steps) {
            if (step.type.equals("visit_node") && step.data.containsKey("nodeId")) {
                exploredNodes.add((String) step.data.get("nodeId"));
            }
        }
        
        return exploredNodes.size();
    }
}