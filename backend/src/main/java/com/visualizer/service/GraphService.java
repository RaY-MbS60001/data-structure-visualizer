package com.visualizer.service;

import com.visualizer.model.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class GraphService {
    
    public Graph generateRandomGraph(int nodeCount, int edgeCount) {
        Graph graph = new Graph();
        Random rand = new Random();
        
        // Generate nodes
        for (int i = 0; i < nodeCount; i++) {
            Node node = new Node(
                "node" + i,
                "Node " + i,
                rand.nextDouble() * 800,
                rand.nextDouble() * 600
            );
            graph.addNode(node);
        }
        
        // Generate edges
        for (int i = 0; i < edgeCount; i++) {
            String source = "node" + rand.nextInt(nodeCount);
            String target = "node" + rand.nextInt(nodeCount);
            if (!source.equals(target)) {
                Edge edge = new Edge(
                    "edge" + i,
                    source,
                    target,
                    rand.nextDouble() * 10 + 1
                );
                graph.addEdge(edge);
            }
        }
        
        return graph;
    }
}
