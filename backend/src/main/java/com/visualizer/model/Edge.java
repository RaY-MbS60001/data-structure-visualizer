package com.visualizer.model;

public class Edge {
    private String id;
    private String source;
    private String target;
    private double weight;
    
    public Edge(String id, String source, String target, double weight) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.weight = weight;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public String getSource() { return source; }
    public String getTarget() { return target; }
    public double getWeight() { return weight; }
}
