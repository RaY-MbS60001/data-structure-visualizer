package com.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.*;

@Data
public class FileBinaryTree {
    
    @Data
    @AllArgsConstructor
    public static class TreeNode {
        private StoredFile file;
        private TreeNode left;
        private TreeNode right;
        private String nodeId;
        private int level;
        
        public TreeNode(StoredFile file, int level) {
            this.file = file;
            this.nodeId = UUID.randomUUID().toString();
            this.level = level;
        }
    }
    
    @Data
    @AllArgsConstructor
    public static class VisualizationStep {
        private String operation;
        private String description;
        private List<NodeSnapshot> currentState;
        private String highlightedNodeId;
        private Map<String, Object> metadata;
    }
    
    @Data
    @AllArgsConstructor
    public static class NodeSnapshot {
        private String nodeId;
        private String filename;
        private String size;
        private int level;
        private String leftChildId;
        private String rightChildId;
        private String parentId;
    }
    
    private TreeNode root;
    private int size;
    private List<VisualizationStep> steps;
    
    public FileBinaryTree() {
        this.root = null;
        this.size = 0;
        this.steps = new ArrayList<>();
    }
    
    public List<VisualizationStep> insert(StoredFile file) {
        steps.clear();
        
        steps.add(new VisualizationStep(
            "START_INSERT",
            "ðŸŒ³ Inserting: " + file.getFilename(),
            convertToSnapshots(),
            null,
            Map.of("action", "insert", "filename", file.getFilename())
        ));
        
        if (root == null) {
            root = new TreeNode(file, 0);
            size++;
            
            steps.add(new VisualizationStep(
                "SET_ROOT",
                "âœ… Set as ROOT node",
                convertToSnapshots(),
                root.getNodeId(),
                Map.of("isRoot", true)
            ));
            
            return steps;
        }
        
        insertRecursive(root, file, 1);
        size++;
        
        steps.add(new VisualizationStep(
            "INSERT_COMPLETE",
            "âœ… Inserted! Tree size: " + size,
            convertToSnapshots(),
            null,
            Map.of("size", size)
        ));
        
        return new ArrayList<>(steps);
    }
    
    private TreeNode insertRecursive(TreeNode current, StoredFile file, int level) {
        if (current == null) {
            TreeNode newNode = new TreeNode(file, level);
            
            steps.add(new VisualizationStep(
                "INSERT_NODE",
                "ðŸ“ Created node at level " + level,
                convertToSnapshots(),
                newNode.getNodeId(),
                Map.of("level", level)
            ));
            
            return newNode;
        }
        
        steps.add(new VisualizationStep(
            "TRAVERSE",
            "ðŸ” Comparing with: " + current.getFile().getFilename(),
            convertToSnapshots(),
            current.getNodeId(),
            Map.of("comparing", true)
        ));
        
        // Simple BST: compare by filename
        if (file.getFilename().compareTo(current.getFile().getFilename()) < 0) {
            steps.add(new VisualizationStep(
                "GO_LEFT",
                "â¬…ï¸ Going LEFT (smaller)",
                convertToSnapshots(),
                current.getNodeId(),
                Map.of("direction", "left")
            ));
            current.setLeft(insertRecursive(current.getLeft(), file, level + 1));
        } else {
            steps.add(new VisualizationStep(
                "GO_RIGHT",
                "âž¡ï¸ Going RIGHT (larger/equal)",
                convertToSnapshots(),
                current.getNodeId(),
                Map.of("direction", "right")
            ));
            current.setRight(insertRecursive(current.getRight(), file, level + 1));
        }
        
        return current;
    }
    
    public List<VisualizationStep> search(String filename) {
        steps.clear();
        
        steps.add(new VisualizationStep(
            "START_SEARCH",
            "ðŸ”Ž Searching for: " + filename,
            convertToSnapshots(),
            null,
            Map.of("target", filename)
        ));
        
        searchRecursive(root, filename);
        
        return new ArrayList<>(steps);
    }
    
    private TreeNode searchRecursive(TreeNode current, String filename) {
        if (current == null) {
            steps.add(new VisualizationStep(
                "NOT_FOUND",
                "âŒ File not found",
                convertToSnapshots(),
                null,
                Map.of("found", false)
            ));
            return null;
        }
        
        steps.add(new VisualizationStep(
            "COMPARE",
            "ðŸ” Checking: " + current.getFile().getFilename(),
            convertToSnapshots(),
            current.getNodeId(),
            Map.of("comparing", current.getFile().getFilename())
        ));
        
        if (filename.equals(current.getFile().getFilename())) {
            steps.add(new VisualizationStep(
                "FOUND",
                "âœ… FOUND at level " + current.getLevel(),
                convertToSnapshots(),
                current.getNodeId(),
                Map.of("found", true, "level", current.getLevel())
            ));
            return current;
        }
        
        if (filename.compareTo(current.getFile().getFilename()) < 0) {
            steps.add(new VisualizationStep(
                "GO_LEFT",
                "â¬…ï¸ Going LEFT...",
                convertToSnapshots(),
                current.getNodeId(),
                Map.of("direction", "left")
            ));
            return searchRecursive(current.getLeft(), filename);
        }
        
        steps.add(new VisualizationStep(
            "GO_RIGHT",
            "âž¡ï¸ Going RIGHT...",
            convertToSnapshots(),
            current.getNodeId(),
            Map.of("direction", "right")
        ));
        return searchRecursive(current.getRight(), filename);
    }
    
    private List<NodeSnapshot> convertToSnapshots() {
        List<NodeSnapshot> snapshots = new ArrayList<>();
        if (root != null) {
            traverseForSnapshots(root, snapshots, null);
        }
        return snapshots;
    }
    
    private void traverseForSnapshots(TreeNode node, List<NodeSnapshot> snapshots, String parentId) {
        if (node == null) return;
        
        snapshots.add(new NodeSnapshot(
            node.getNodeId(),
            node.getFile().getFilename(),
            node.getFile().getSizeFormatted(),
            node.getLevel(),
            node.getLeft() != null ? node.getLeft().getNodeId() : null,
            node.getRight() != null ? node.getRight().getNodeId() : null,
            parentId
        ));
        
        traverseForSnapshots(node.getLeft(), snapshots, node.getNodeId());
        traverseForSnapshots(node.getRight(), snapshots, node.getNodeId());
    }
    
    public int getSize() { return size; }
    public boolean isEmpty() { return root == null; }
}
