package com.visualizer.service;

import com.visualizer.model.FileLinkedList;
import com.visualizer.model.StoredFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    private Path fileStorageLocation;
    private FileLinkedList fileList;
    
    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("✅ Upload directory created: " + this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
        
        this.fileList = new FileLinkedList();
    }
    
    // Existing methods for Linked List...
    public List<FileLinkedList.VisualizationStep> storeFile(MultipartFile file) {
        try {
            String filename = file.getOriginalFilename();
            if (filename == null || filename.contains("..")) {
                throw new RuntimeException("Invalid filename: " + filename);
            }
            
            String uniqueFilename = System.currentTimeMillis() + "_" + filename;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            StoredFile storedFile = new StoredFile(
                filename,
                file.getContentType(),
                file.getSize(),
                targetLocation.toString()
            );
            
            return fileList.insert(storedFile);
            
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
    }
    
    // NEW METHOD for other data structures (Stack, Queue, Tree)
    public StoredFile storeFileOnly(MultipartFile file) {
        try {
            String filename = file.getOriginalFilename();
            if (filename == null || filename.contains("..")) {
                throw new RuntimeException("Invalid filename: " + filename);
            }
            
            String uniqueFilename = System.currentTimeMillis() + "_" + filename;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            return new StoredFile(
                filename,
                file.getContentType(),
                file.getSize(),
                targetLocation.toString()
            );
            
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
    }
    
    public List<FileLinkedList.VisualizationStep> searchFile(String filename) {
        return fileList.search(filename);
    }
    
    public List<FileLinkedList.VisualizationStep> deleteFile(String filename) {
        List<FileLinkedList.VisualizationStep> steps = fileList.delete(filename);
        
        try {
            StoredFile fileToDelete = fileList.getAllFiles().stream()
                .filter(f -> f.getFilename().equals(filename))
                .findFirst()
                .orElse(null);
            
            if (fileToDelete != null) {
                Path filePath = Paths.get(fileToDelete.getStoragePath());
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ex) {
            System.err.println("Failed to delete physical file: " + ex.getMessage());
        }
        
        return steps;
    }
    
    public Map<String, Object> getCurrentVisualizationState() {
        List<StoredFile> allFiles = fileList.getAllFiles();
        
        Map<String, Object> state = new HashMap<>();
        state.put("totalFiles", fileList.getSize());
        state.put("isEmpty", fileList.isEmpty());
        state.put("files", allFiles);
        
        long totalSize = allFiles.stream()
            .mapToLong(StoredFile::getSize)
            .sum();
        state.put("totalStorageUsed", totalSize);
        
        return state;
    }
    
    public List<StoredFile> getAllFiles() {
        return fileList.getAllFiles();
    }
}