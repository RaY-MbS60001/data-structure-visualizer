package com.visualizer.model;

public class Node {
    private String id;
    private String label;
    private double x;
    private double y;
    
    public Node(String id, String label, double x, double y) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public String getLabel() { return label; }
    public double getX() { return x; }
    public double getY() { return y; }
}
