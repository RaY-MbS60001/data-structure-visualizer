package com.visualizer.controller;

import com.visualizer.model.*;
import com.visualizer.service.GraphService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/graph")
@CrossOrigin(origins = "*")
public class GraphController {
    
    @Autowired
    private GraphService graphService;
    
    @GetMapping("/random")
    public Graph generateRandomGraph(@RequestParam(defaultValue = "10") int nodes,
                                   @RequestParam(defaultValue = "15") int edges) {
        return graphService.generateRandomGraph(nodes, edges);
    }
    
    @PostMapping("/create")
    public Graph createGraph(@RequestBody Graph graph) {
        // Save and return graph
        return graph;
    }
}
