package com.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.*;

@Data
public class FileQueue {
    
    @Data
    @AllArgsConstructor
    public static class QueueNode {
        private StoredFile file;
        private String nodeId;
        private int position;
        
        public QueueNode(StoredFile file, int position) {
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
        private boolean isFront;
        private boolean isRear;
    }
    
    private Queue<QueueNode> queue;
    private int maxSize;
    private List<VisualizationStep> steps;
    
    public FileQueue(int maxSize) {
        this.queue = new LinkedList<>();
        this.maxSize = maxSize;
        this.steps = new ArrayList<>();
    }
    
    public List<VisualizationStep> enqueue(StoredFile file) {
        steps.clear();
        
        if (queue.size() >= maxSize) {
            steps.add(new VisualizationStep(
                "QUEUE_FULL",
                "❌ Queue FULL! Max: " + maxSize,
                convertToSnapshots(),
                null,
                Map.of("isFull", true)
            ));
            return steps;
        }
        
        steps.add(new VisualizationStep(
            "PREPARE_ENQUEUE",
            "📦 Preparing to ENQUEUE: " + file.getFilename(),
            convertToSnapshots(),
            null,
            Map.of("action", "enqueue")
        ));
        
        QueueNode newNode = new QueueNode(file, queue.size());
        
        steps.add(new VisualizationStep(
            "CREATE_NODE",
            "📝 Adding to REAR",
            convertToSnapshots(),
            null,
            Map.of("position", queue.size())
        ));
        
        queue.offer(newNode);
        
        steps.add(new VisualizationStep(
            "ENQUEUE_COMPLETE",
            "✅ ENQUEUED at REAR! Size: " + queue.size(),
            convertToSnapshots(),
            newNode.getNodeId(),
            Map.of("size", queue.size(), "rear", newNode.getNodeId())
        ));
        
        return new ArrayList<>(steps);
    }
    
    public List<VisualizationStep> dequeue() {
        steps.clear();
        
        if (queue.isEmpty()) {
            steps.add(new VisualizationStep(
                "QUEUE_EMPTY",
                "❌ Queue EMPTY!",
                convertToSnapshots(),
                null,
                Map.of("isEmpty", true)
            ));
            return steps;
        }
        
        QueueNode frontNode = queue.peek();
        
        steps.add(new VisualizationStep(
            "SHOW_FRONT",
            "👀 FRONT: " + frontNode.getFile().getFilename(),
            convertToSnapshots(),
            frontNode.getNodeId(),
            Map.of("front", frontNode.getFile().getFilename())
        ));
        
        QueueNode dequeuedNode = queue.poll();
        
        steps.add(new VisualizationStep(
            "REMOVING",
            "🗑️ Removing from FRONT...",
            convertToSnapshots(),
            null,
            Map.of("removed", dequeuedNode.getFile().getFilename())
        ));
        
        steps.add(new VisualizationStep(
            "DEQUEUE_COMPLETE",
            "✅ DEQUEUED: " + dequeuedNode.getFile().getFilename(),
            convertToSnapshots(),
            null,
            Map.of("dequeued", dequeuedNode.getFile().getFilename(), "size", queue.size())
        ));
        
        return new ArrayList<>(steps);
    }

    /**
     * Inspect the front of the queue and return visualization steps without removing the element.
     */
    public List<VisualizationStep> peek() {
        steps.clear();

        if (queue.isEmpty()) {
            steps.add(new VisualizationStep(
                "QUEUE_EMPTY",
                "❌ Queue EMPTY!",
                convertToSnapshots(),
                null,
                Map.of("isEmpty", true)
            ));
            return steps;
        }

        QueueNode frontNode = queue.peek();

        steps.add(new VisualizationStep(
            "SHOW_FRONT",
            "👀 FRONT: " + frontNode.getFile().getFilename(),
            convertToSnapshots(),
            frontNode.getNodeId(),
            Map.of("front", frontNode.getFile().getFilename())
        ));

        return new ArrayList<>(steps);
    }
    
    private List<NodeSnapshot> convertToSnapshots() {
        List<NodeSnapshot> snapshots = new ArrayList<>();
        List<QueueNode> nodes = new ArrayList<>(queue);
        
        for (int i = 0; i < nodes.size(); i++) {
            QueueNode node = nodes.get(i);
            snapshots.add(new NodeSnapshot(
                node.getNodeId(),
                node.getFile().getFilename(),
                node.getFile().getSizeFormatted(),
                node.getFile().getContentType(),
                i,
                i == 0,
                i == nodes.size() - 1
            ));
        }
        
        return snapshots;
    }
    
    public int getSize() { return queue.size(); }
    public boolean isEmpty() { return queue.isEmpty(); }
    public boolean isFull() { return queue.size() >= maxSize; }
    public List<StoredFile> getAllFiles() {
        return queue.stream().map(QueueNode::getFile).toList();
    }
}