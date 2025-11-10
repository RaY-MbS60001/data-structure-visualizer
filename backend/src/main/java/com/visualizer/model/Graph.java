package com.visualizer.model;

import java.util.*;

public class Graph {
    private Map<String, Node> nodes;
    private List<Edge> edges;
    
    public Graph() {
        this.nodes = new HashMap<>();
        this.edges = new ArrayList<>();
    }
    
    public void addNode(Node node) {
        nodes.put(node.getId(), node);
    }
    
    public void addEdge(Edge edge) {
        edges.add(edge);
    }
    
    // Getters and setters
    public Map<String, Node> getNodes() { return nodes; }
    public List<Edge> getEdges() { return edges; }
}
