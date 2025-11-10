package com.visualizer.model;

public class MapNode extends Node {
    private double latitude;
    private double longitude;
    private String cityName;
    
    public MapNode(String id, String label, double x, double y, double lat, double lon, String cityName) {
        super(id, label, x, y);
        this.latitude = lat;
        this.longitude = lon;
        this.cityName = cityName;
    }
    
    // Getters and setters
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public String getCityName() { return cityName; }
}
