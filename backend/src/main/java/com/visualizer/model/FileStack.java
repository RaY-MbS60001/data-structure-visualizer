package com.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.*;

@Data
public class FileStack {
    
    @Data
    @AllArgsConstructor
    public static class StackNode {
        private StoredFile file;
        private String nodeId;
        private int position;
        
        public StackNode(StoredFile file, int position) {
            this.file = file;
            this.nodeId = UUID.randomUUID().toString();
            this.position = position;
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
        private String contentType;
        private int position;
    }
    
    private Stack<StackNode> stack;
    private int maxSize;
    private List<VisualizationStep> steps;
    
    public FileStack(int maxSize) {
        this.stack = new Stack<>();
        this.maxSize = maxSize;
        this.steps = new ArrayList<>();
    }
    
    public List<VisualizationStep> push(StoredFile file) {
        steps.clear();
        
        if (stack.size() >= maxSize) {
            steps.add(new VisualizationStep(
                "OVERFLOW",
                "âŒ Stack Overflow! Cannot push. Max: " + maxSize,
                convertToSnapshots(),
                null,
                Map.of("isFull", true, "size", stack.size())
            ));
            return steps;
        }
        
        steps.add(new VisualizationStep(
            "PREPARE_PUSH",
            "ðŸ“¦ Preparing to PUSH: " + file.getFilename(),
            convertToSnapshots(),
            null,
            Map.of("action", "push")
        ));
        
        StackNode newNode = new StackNode(file, stack.size());
        
        steps.add(new VisualizationStep(
            "CREATE_NODE",
            "ðŸ“ Creating stack node at position " + stack.size(),
            convertToSnapshots(),
            newNode.getNodeId(),
            Map.of("position", stack.size())
        ));
        
        stack.push(newNode);
        
        steps.add(new VisualizationStep(
            "PUSH_COMPLETE",
            "âœ… PUSHED! Stack size: " + stack.size() + "/" + maxSize,
            convertToSnapshots(),
            newNode.getNodeId(),
            Map.of("size", stack.size(), "top", newNode.getNodeId())
        ));
        
        return new ArrayList<>(steps);
    }
    
    public List<VisualizationStep> pop() {
        steps.clear();
        
        if (stack.isEmpty()) {
            steps.add(new VisualizationStep(
                "UNDERFLOW",
                "âŒ Stack Underflow! Empty stack",
                convertToSnapshots(),
                null,
                Map.of("isEmpty", true)
            ));
            return steps;
        }
        
        StackNode topNode = stack.peek();
        
        steps.add(new VisualizationStep(
            "SHOW_TOP",
            "ðŸ‘€ TOP element: " + topNode.getFile().getFilename(),
            convertToSnapshots(),
            topNode.getNodeId(),
            Map.of("top", topNode.getFile().getFilename())
        ));
        
        StackNode poppedNode = stack.pop();
        
        steps.add(new VisualizationStep(
            "REMOVING",
            "ðŸ—‘ï¸ Removing TOP...",
            convertToSnapshots(),
            poppedNode.getNodeId(),
            Map.of("removed", poppedNode.getFile().getFilename())
        ));
        
        steps.add(new VisualizationStep(
            "POP_COMPLETE",
            "âœ… POPPED: " + poppedNode.getFile().getFilename() + " | Size: " + stack.size(),
            convertToSnapshots(),
            null,
            Map.of("popped", poppedNode.getFile().getFilename(), "size", stack.size())
        ));
        
        return new ArrayList<>(steps);
    }
    
    public List<VisualizationStep> peek() {
        steps.clear();
        
        if (stack.isEmpty()) {
            steps.add(new VisualizationStep(
                "EMPTY_STACK",
                "ðŸ“­ Stack is empty",
                convertToSnapshots(),
                null,
                Map.of("isEmpty", true)
            ));
            return steps;
        }
        
        StackNode topNode = stack.peek();
        
        steps.add(new VisualizationStep(
            "PEEK",
            "ðŸ‘ï¸ PEEK - Top: " + topNode.getFile().getFilename(),
            convertToSnapshots(),
            topNode.getNodeId(),
            Map.of("top", topNode.getFile().getFilename())
        ));
        
        return new ArrayList<>(steps);
    }
    
    private List<NodeSnapshot> convertToSnapshots() {
        List<NodeSnapshot> snapshots = new ArrayList<>();
        List<StackNode> nodes = new ArrayList<>(stack);
        
        for (int i = 0; i < nodes.size(); i++) {
            StackNode node = nodes.get(i);
            snapshots.add(new NodeSnapshot(
                node.getNodeId(),
                node.getFile().getFilename(),
                node.getFile().getSizeFormatted(),
                node.getFile().getContentType(),
                i
            ));
        }
        
        return snapshots;
    }
    
    public int getSize() { return stack.size(); }
    public boolean isEmpty() { return stack.isEmpty(); }
    public boolean isFull() { return stack.size() >= maxSize; }
    public List<StoredFile> getAllFiles() {
        return stack.stream().map(StackNode::getFile).toList();
    }
}
