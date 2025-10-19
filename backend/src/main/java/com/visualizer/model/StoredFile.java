package com.visualizer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoredFile {
    private String id;
    private String filename;
    private String originalFilename;
    private String contentType;
    private long size;
    private LocalDateTime uploadedAt;
    private String storagePath;
    
    // For visualization purposes
    private String status; // "idle", "inserting", "searching", "deleting", "found"
    
    public StoredFile(String filename, String contentType, long size, String storagePath) {
        this.id = UUID.randomUUID().toString();
        this.filename = filename;
        this.originalFilename = filename;
        this.contentType = contentType;
        this.size = size;
        this.uploadedAt = LocalDateTime.now();
        this.storagePath = storagePath;
        this.status = "idle";
    }
    
    public String getSizeFormatted() {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        return String.format("%.2f MB", size / (1024.0 * 1024.0));
    }
}