package com.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;

import java.util.*;

@Data
public class FileLinkedList {
    
    @Data
    @AllArgsConstructor
    public static class Node {
        private StoredFile file;
        private Node next;
        private String nodeId;
        
        public Node(StoredFile file) {
            this.file = file;
            this.next = null;
            this.nodeId = UUID.randomUUID().toString();
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
        
        public VisualizationStep(String operation, String description, 
                                List<Node> nodes, Node highlightedNode) {
            this.operation = operation;
            this.description = description;
            this.currentState = convertNodesToSnapshots(nodes);
            this.highlightedNodeId = highlightedNode != null ? highlightedNode.getNodeId() : null;
            this.metadata = new HashMap<>();
        }
        
        private List<NodeSnapshot> convertNodesToSnapshots(List<Node> nodes) {
            List<NodeSnapshot> snapshots = new ArrayList<>();
            for (int i = 0; i < nodes.size(); i++) {
                Node node = nodes.get(i);
                snapshots.add(new NodeSnapshot(
                    node.getNodeId(),
                    node.getFile().getFilename(),
                    node.getFile().getSizeFormatted(),
                    node.getFile().getContentType(),
                    i,
                    node.getNext() != null ? node.getNext().getNodeId() : null
                ));
            }
            return snapshots;
        }
    }
    
    @Data
    @AllArgsConstructor
    public static class NodeSnapshot {
        private String nodeId;
        private String filename;
        private String size;
        private String contentType;
        private int position;
        private String nextNodeId;
    }
    
    private Node head;
    private int size;
    private List<VisualizationStep> steps;
    
    public FileLinkedList() {
        this.head = null;
        this.size = 0;
        this.steps = new ArrayList<>();
    }
    
    // ===== INSERT OPERATION =====
    public List<VisualizationStep> insert(StoredFile file) {
        steps.clear();
        
        Node newNode = new Node(file);
        
        // Step 1: Create new node
        steps.add(new VisualizationStep(
            "CREATE_NODE",
            "ðŸ“¦ Creating new node for file: " + file.getFilename(),
            Collections.singletonList(newNode),
            newNode
        ));
        
        if (head == null) {
            // Step 2: Empty list - set as head
            head = newNode;
            steps.add(new VisualizationStep(
                "SET_HEAD",
                "âœ¨ List was empty. Setting as HEAD node.",
                Collections.singletonList(newNode),
                newNode
            ));
        } else {
            // Step 2: Traverse to find the end
            Node current = head;
            List<Node> traversedNodes = new ArrayList<>();
            traversedNodes.add(current);
            
            int position = 0;
            while (current.next != null) {
                steps.add(new VisualizationStep(
                    "TRAVERSE",
                    String.format("ðŸ” Traversing... Currently at position %d: %s", 
                                position, current.getFile().getFilename()),
                    new ArrayList<>(traversedNodes),
                    current
                ));
                
                current = current.next;
                traversedNodes.add(current);
                position++;
            }
            
            // Step 3: Found the end
            steps.add(new VisualizationStep(
                "FOUND_END",
                String.format("ðŸŽ¯ Found end of list at position %d", position),
                new ArrayList<>(traversedNodes),
                current
            ));
            
            // Step 4: Link new node
            current.next = newNode;
            traversedNodes.add(newNode);
            
            steps.add(new VisualizationStep(
                "LINK_NODE",
                "ðŸ”— Linking new node to the end of the list",
                traversedNodes,
                newNode
            ));
        }
        
        size++;
        
        // Final step
        VisualizationStep finalStep = new VisualizationStep(
            "COMPLETE",
            String.format("âœ… File added successfully! Total files: %d", size),
            getAllNodes(),
            null
        );
        finalStep.getMetadata().put("totalSize", size);
        finalStep.getMetadata().put("newFileId", newNode.getNodeId());
        steps.add(finalStep);
        
        return new ArrayList<>(steps);
    }
    
    // ===== SEARCH OPERATION =====
    public List<VisualizationStep> search(String filename) {
        steps.clear();
        
        if (head == null) {
            steps.add(new VisualizationStep(
                "EMPTY_LIST",
                "âŒ Cannot search in empty list",
                Collections.emptyList(),
                null
            ));
            return steps;
        }
        
        Node current = head;
        int position = 0;
        List<Node> allNodes = getAllNodes();
        
        steps.add(new VisualizationStep(
            "START_SEARCH",
            String.format("ðŸ”Ž Starting search for: %s", filename),
            allNodes,
            null
        ));
        
        while (current != null) {
            steps.add(new VisualizationStep(
                "COMPARE",
                String.format("ðŸ” Position %d: Comparing '%s' with '%s'", 
                            position, current.getFile().getFilename(), filename),
                allNodes,
                current
            ));
            
            if (current.getFile().getFilename().equals(filename)) {
                VisualizationStep foundStep = new VisualizationStep(
                    "FOUND",
                    String.format("ðŸŽ‰ File FOUND at position %d!", position),
                    allNodes,
                    current
                );
                foundStep.getMetadata().put("foundPosition", position);
                foundStep.getMetadata().put("foundNodeId", current.getNodeId());
                steps.add(foundStep);
                
                return steps;
            }
            
            current = current.next;
            position++;
        }
        
        // Not found
        steps.add(new VisualizationStep(
            "NOT_FOUND",
            String.format("âŒ File '%s' not found in the list", filename),
            allNodes,
            null
        ));
        
        return steps;
    }
    
    // ===== DELETE OPERATION =====
    public List<VisualizationStep> delete(String filename) {
        steps.clear();
        
        if (head == null) {
            steps.add(new VisualizationStep(
                "EMPTY_LIST",
                "âŒ Cannot delete from empty list",
                Collections.emptyList(),
                null
            ));
            return steps;
        }
        
        // Special case: deleting head
        if (head.getFile().getFilename().equals(filename)) {
            List<Node> beforeDelete = getAllNodes();
            
            steps.add(new VisualizationStep(
                "DELETE_HEAD",
                "ðŸŽ¯ Target is HEAD node. Preparing to delete...",
                beforeDelete,
                head
            ));
            
            head = head.next;
            size--;
            
            steps.add(new VisualizationStep(
                "COMPLETE",
                String.format("âœ… HEAD deleted. New HEAD set. Remaining files: %d", size),
                head != null ? getAllNodes() : Collections.emptyList(),
                head
            ));
            
            return steps;
        }
        
        // General case
        Node current = head;
        Node previous = null;
        int position = 0;
        List<Node> allNodes = getAllNodes();
        
        steps.add(new VisualizationStep(
            "START_DELETE",
            String.format("ðŸ—‘ï¸  Starting deletion of: %s", filename),
            allNodes,
            null
        ));
        
        while (current != null) {
            steps.add(new VisualizationStep(
                "TRAVERSE",
                String.format("ðŸ” Position %d: Checking '%s'", 
                            position, current.getFile().getFilename()),
                allNodes,
                current
            ));
            
            if (current.getFile().getFilename().equals(filename)) {
                steps.add(new VisualizationStep(
                    "FOUND_TARGET",
                    String.format("ðŸŽ¯ Found target at position %d. Preparing to delete...", position),
                    allNodes,
                    current
                ));
                
                // Relink (previous should never be null here because head case handled above,
                // but guard defensively to satisfy static analysis)
                if (previous != null) {
                    previous.next = current.next;
                    size--;
                }
                
                steps.add(new VisualizationStep(
                    "RELINK",
                    "ðŸ”— Relinking: Connecting previous node to next node",
                    getAllNodes(),
                    previous
                ));
                
                steps.add(new VisualizationStep(
                    "COMPLETE",
                    String.format("âœ… File deleted successfully! Remaining files: %d", size),
                    getAllNodes(),
                    null
                ));
                
                return steps;
            }
            
            previous = current;
            current = current.next;
            position++;
        }
        
        // Not found
        steps.add(new VisualizationStep(
            "NOT_FOUND",
            String.format("âŒ File '%s' not found. Nothing deleted.", filename),
            allNodes,
            null
        ));
        
        return steps;
    }
    
    // ===== HELPER METHODS =====
    private List<Node> getAllNodes() {
        List<Node> nodes = new ArrayList<>();
        Node current = head;
        while (current != null) {
            nodes.add(current);
            current = current.next;
        }
        return nodes;
    }
    
    public List<StoredFile> getAllFiles() {
        List<StoredFile> files = new ArrayList<>();
        Node current = head;
        while (current != null) {
            files.add(current.getFile());
            current = current.next;
        }
        return files;
    }
    
    public int getSize() {
        return size;
    }
    
    public boolean isEmpty() {
        return head == null;
    }
}
