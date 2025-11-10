package com.visualizer.model;

public class MapEdge extends Edge {
    private double distance; // in km
    private int travelTime; // in minutes
    private String roadName;
    
    public MapEdge(String id, String source, String target, double weight, double distance, int travelTime, String roadName) {
        super(id, source, target, weight);
        this.distance = distance;
        this.travelTime = travelTime;
        this.roadName = roadName;
    }
    
    // Getters and setters
    public double getDistance() { return distance; }
    public int getTravelTime() { return travelTime; }
    public String getRoadName() { return roadName; }
}
