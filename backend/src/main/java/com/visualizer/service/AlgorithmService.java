package com.visualizer.service;

import com.visualizer.model.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AlgorithmService {
    
    public static class AlgorithmStep {
        public String type;
        public Map<String, Object> data;
        public long timestamp;
        
        public AlgorithmStep(String type, Map<String, Object> data) {
            this.type = type;
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
    }
    
    // Sorting Algorithms
    public List<Map<String, Object>> sort(String algorithm, List<Integer> array) {
        List<Map<String, Object>> steps = new ArrayList<>();
        
        switch (algorithm.toLowerCase()) {
            case "bubble":
                bubbleSort(array, steps);
                break;
            case "quick":
                quickSort(array, 0, array.size() - 1, steps);
                break;
            case "insertion":
                insertionSort(array, steps);
                break;
            case "selection":
                selectionSort(array, steps);
                break;
        }
        
        return steps;
    }
    
    private void bubbleSort(List<Integer> array, List<Map<String, Object>> steps) {
        int n = array.size();
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                steps.add(Map.of(
                    "type", "compare",
                    "indices", List.of(j, j + 1)
                ));
                
                if (array.get(j) > array.get(j + 1)) {
                    Collections.swap(array, j, j + 1);
                    steps.add(Map.of(
                        "type", "swap",
                        "indices", List.of(j, j + 1)
                    ));
                }
            }
        }
    }
    
    private void quickSort(List<Integer> array, int low, int high, List<Map<String, Object>> steps) {
        if (low < high) {
            int pi = partition(array, low, high, steps);
            quickSort(array, low, pi - 1, steps);
            quickSort(array, pi + 1, high, steps);
        }
    }
    
    private int partition(List<Integer> array, int low, int high, List<Map<String, Object>> steps) {
        int pivot = array.get(high);
        steps.add(Map.of(
            "type", "pivot",
            "index", high,
            "value", pivot
        ));
        
        int i = low - 1;
        for (int j = low; j < high; j++) {
            steps.add(Map.of(
                "type", "compare",
                "indices", List.of(j, high)
            ));
            
            if (array.get(j) < pivot) {
                i++;
                if (i != j) {
                    Collections.swap(array, i, j);
                    steps.add(Map.of(
                        "type", "swap",
                        "indices", List.of(i, j)
                    ));
                }
            }
        }
        
        Collections.swap(array, i + 1, high);
        steps.add(Map.of(
            "type", "swap",
            "indices", List.of(i + 1, high)
        ));
        
        return i + 1;
    }
    
    private void insertionSort(List<Integer> array, List<Map<String, Object>> steps) {
        for (int i = 1; i < array.size(); i++) {
            int key = array.get(i);
            int j = i - 1;
            
            steps.add(Map.of(
                "type", "select",
                "index", i,
                "value", key
            ));
            
            while (j >= 0 && array.get(j) > key) {
                array.set(j + 1, array.get(j));
                steps.add(Map.of(
                    "type", "shift",
                    "from", j,
                    "to", j + 1
                ));
                j--;
            }
            
            array.set(j + 1, key);
            steps.add(Map.of(
                "type", "insert",
                "index", j + 1,
                "value", key
            ));
        }
    }
    
    private void selectionSort(List<Integer> array, List<Map<String, Object>> steps) {
        int n = array.size();
        
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            steps.add(Map.of(
                "type", "select",
                "index", i
            ));
            
            for (int j = i + 1; j < n; j++) {
                steps.add(Map.of(
                    "type", "compare",
                    "indices", List.of(j, minIdx)
                ));
                
                if (array.get(j) < array.get(minIdx)) {
                    minIdx = j;
                    steps.add(Map.of(
                        "type", "update_min",
                        "index", minIdx
                    ));
                }
            }
            
            if (minIdx != i) {
                Collections.swap(array, i, minIdx);
                steps.add(Map.of(
                    "type", "swap",
                    "indices", List.of(i, minIdx)
                ));
            }
        }
    }
    
    // Searching Algorithms
    public Map<String, Object> search(String algorithm, List<Integer> array, int target) {
        List<Map<String, Object>> steps = new ArrayList<>();
        int result = -1;
        
        switch (algorithm.toLowerCase()) {
            case "linear":
                result = linearSearch(array, target, steps);
                break;
            case "binary":
                result = binarySearch(array, target, steps);
                break;
            case "jump":
                result = jumpSearch(array, target, steps);
                break;
            case "interpolation":
                result = interpolationSearch(array, target, steps);
                break;
        }
        
        return Map.of(
            "found", result != -1,
            "index", result,
            "steps", steps,
            "elementsChecked", steps.size()
        );
    }
    
    private int linearSearch(List<Integer> array, int target, List<Map<String, Object>> steps) {
        for (int i = 0; i < array.size(); i++) {
            steps.add(Map.of(
                "type", "check",
                "index", i,
                "value", array.get(i)
            ));
            
            if (array.get(i) == target) {
                steps.add(Map.of(
                    "type", "found",
                    "index", i
                ));
                return i;
            }
        }
        return -1;
    }
    
    private int binarySearch(List<Integer> array, int target, List<Map<String, Object>> steps) {
        int left = 0;
        int right = array.size() - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            steps.add(Map.of(
                "type", "range",
                "left", left,
                "right", right,
                "mid", mid
            ));
            
            if (array.get(mid) == target) {
                steps.add(Map.of(
                    "type", "found",
                    "index", mid
                ));
                return mid;
            }
            
            if (array.get(mid) < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
    
    private int jumpSearch(List<Integer> array, int target, List<Map<String, Object>> steps) {
        int n = array.size();
        int step = (int) Math.sqrt(n);
        int prev = 0;
        
        while (prev < n && array.get(Math.min(step, n) - 1) < target) {
            steps.add(Map.of(
                "type", "jump",
                "from", prev,
                "to", Math.min(step, n) - 1
            ));
            
            prev = step;
            step += (int) Math.sqrt(n);
            
            if (prev >= n) {
                return -1;
            }
        }
        
        while (prev < n && array.get(prev) < target) {
            steps.add(Map.of(
                "type", "check",
                "index", prev,
                "value", array.get(prev)
            ));
            
            if (array.get(prev) == target) {
                steps.add(Map.of(
                    "type", "found",
                    "index", prev
                ));
                return prev;
            }
            prev++;
        }
        
        if (prev < n && array.get(prev) == target) {
            steps.add(Map.of(
                "type", "found",
                "index", prev
            ));
            return prev;
        }
        
        return -1;
    }
    
    private int interpolationSearch(List<Integer> array, int target, List<Map<String, Object>> steps) {
        int low = 0;
        int high = array.size() - 1;
        
        while (low <= high && target >= array.get(low) && target <= array.get(high)) {
            if (low == high) {
                if (array.get(low) == target) {
                    steps.add(Map.of("type", "found", "index", low));
                    return low;
                }
                return -1;
            }
            
            int pos = low + (((high - low) * (target - array.get(low))) / 
                           (array.get(high) - array.get(low)));
            
            steps.add(Map.of(
                "type", "interpolate",
                "position", pos,
                "low", low,
                "high", high
            ));
            
            if (array.get(pos) == target) {
                steps.add(Map.of("type", "found", "index", pos));
                return pos;
            }
            
            if (array.get(pos) < target) {
                low = pos + 1;
            } else {
                high = pos - 1;
            }
        }
        
        return -1;
    }
    
    // Tree/Graph Traversal
    public List<String> traverse(String algorithm, String structure, Map<String, Object> data) {
        List<String> traversalOrder = new ArrayList<>();
        
        if (structure.equals("tree")) {
            TreeNode root = buildTree(data);
            switch (algorithm.toLowerCase()) {
                case "bfs":
                    bfsTree(root, traversalOrder);
                    break;
                case "dfs":
                    dfsTree(root, traversalOrder);
                    break;
                case "inorder":
                    inorderTree(root, traversalOrder);
                    break;
                case "preorder":
                    preorderTree(root, traversalOrder);
                    break;
                case "postorder":
                    postorderTree(root, traversalOrder);
                    break;
            }
        } else if (structure.equals("graph")) {
            Graph graph = buildGraph(data);
            String startNode = (String) data.get("startNode");
            
            switch (algorithm.toLowerCase()) {
                case "bfs":
                    bfsGraph(graph, startNode, traversalOrder);
                    break;
                case "dfs":
                    dfsGraph(graph, startNode, traversalOrder);
                    break;
            }
        }
        
        return traversalOrder;
    }
    
    // Pathfinding Algorithms
    public List<AlgorithmStep> dijkstra(Graph graph, String start, String end) {
        List<AlgorithmStep> steps = new ArrayList<>();
        Map<String, Double> distances = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>();
        Set<String> visited = new HashSet<>();
        
        // Initialize
        for (String nodeId : graph.getNodes().keySet()) {
            distances.put(nodeId, Double.POSITIVE_INFINITY);
            previous.put(nodeId, null);
        }
        distances.put(start, 0.0);
        pq.offer(new NodeDistance(start, 0.0));
        
        steps.add(new AlgorithmStep("init", Map.of(
            "start", start,
            "end", end
        )));
        
        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            String currentId = current.nodeId;
            
            if (visited.contains(currentId)) continue;
            visited.add(currentId);
            
            steps.add(new AlgorithmStep("visit_node", Map.of(
                "nodeId", currentId,
                "distance", distances.get(currentId)
            )));
            
            if (currentId.equals(end)) {
                // Found target, reconstruct path
                List<String> path = reconstructPath(previous, start, end);
                steps.add(new AlgorithmStep("path_found", Map.of(
                    "path", path,
                    "distance", distances.get(end)
                )));
                break;
            }
            
            // Check neighbors
            Node node = graph.getNodes().get(currentId);
            if (node instanceof MapNode) {
                MapNode mapNode = (MapNode) node;
                for (Edge edge : graph.getEdges()) {
                    String neighbor = null;
                    double edgeWeight = edge.getWeight();
                    
                    if (edge.getSource().equals(currentId)) {
                        neighbor = edge.getTarget();
                    } else if (edge.getTarget().equals(currentId)) {
                        neighbor = edge.getSource();
                    }
                    
                    if (neighbor != null && !visited.contains(neighbor)) {
                        double newDist = distances.get(currentId) + edgeWeight;
                        
                        if (newDist < distances.get(neighbor)) {
                            distances.put(neighbor, newDist);
                            previous.put(neighbor, currentId);
                            pq.offer(new NodeDistance(neighbor, newDist));
                            
                            steps.add(new AlgorithmStep("update_distance", Map.of(
                                "nodeId", neighbor,
                                "distance", newDist,
                                "via", currentId
                            )));
                        }
                    }
                }
            }
        }
        
        return steps;
    }
    
    public List<AlgorithmStep> aStar(Graph graph, String start, String end) {
        List<AlgorithmStep> steps = new ArrayList<>();
        Map<String, Double> gScore = new HashMap<>();
        Map<String, Double> fScore = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        PriorityQueue<NodeDistance> openSet = new PriorityQueue<>(
            (a, b) -> Double.compare(fScore.get(a.nodeId), fScore.get(b.nodeId))
        );
        Set<String> openSetIds = new HashSet<>();
        
        // Initialize
        for (String nodeId : graph.getNodes().keySet()) {
            gScore.put(nodeId, Double.POSITIVE_INFINITY);
            fScore.put(nodeId, Double.POSITIVE_INFINITY);
        }
        
        gScore.put(start, 0.0);
        fScore.put(start, heuristic(graph, start, end));
        openSet.offer(new NodeDistance(start, fScore.get(start)));
        openSetIds.add(start);
        
        steps.add(new AlgorithmStep("init", Map.of(
            "start", start,
            "end", end,
            "algorithm", "A*"
        )));
        
        while (!openSet.isEmpty()) {
            NodeDistance current = openSet.poll();
            String currentId = current.nodeId;
            openSetIds.remove(currentId);
            
            steps.add(new AlgorithmStep("visit_node", Map.of(
                "nodeId", currentId,
                "gScore", gScore.get(currentId),
                "fScore", fScore.get(currentId)
            )));
            
            if (currentId.equals(end)) {
                // Reconstruct path
                List<String> path = reconstructPath(cameFrom, start, end);
                steps.add(new AlgorithmStep("path_found", Map.of(
                    "path", path,
                    "distance", gScore.get(end)
                )));
                return steps;
            }
            
            // Check neighbors
            for (Edge edge : graph.getEdges()) {
                String neighbor = null;
                double edgeWeight = edge.getWeight();
                
                if (edge.getSource().equals(currentId)) {
                    neighbor = edge.getTarget();
                } else if (edge.getTarget().equals(currentId)) {
                    neighbor = edge.getSource();
                }
                
                if (neighbor != null) {
                    double tentativeGScore = gScore.get(currentId) + edgeWeight;
                    
                    if (tentativeGScore < gScore.get(neighbor)) {
                        cameFrom.put(neighbor, currentId);
                        gScore.put(neighbor, tentativeGScore);
                        fScore.put(neighbor, tentativeGScore + heuristic(graph, neighbor, end));
                        
                        if (!openSetIds.contains(neighbor)) {
                            openSet.offer(new NodeDistance(neighbor, fScore.get(neighbor)));
                            openSetIds.add(neighbor);
                        }
                        
                        steps.add(new AlgorithmStep("update_scores", Map.of(
                            "nodeId", neighbor,
                            "gScore", tentativeGScore,
                            "fScore", fScore.get(neighbor),
                            "via", currentId
                        )));
                    }
                }
            }
        }
        
        steps.add(new AlgorithmStep("no_path", Map.of()));
        return steps;
    }
    
    public List<AlgorithmStep> bfs(Graph graph, String start) {
        List<AlgorithmStep> steps = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        Map<String, String> parent = new HashMap<>();
        
        queue.offer(start);
        visited.add(start);
        parent.put(start, null);
        
        steps.add(new AlgorithmStep("init", Map.of("start", start)));
        
        while (!queue.isEmpty()) {
            String current = queue.poll();
            
            steps.add(new AlgorithmStep("visit_node", Map.of(
                "nodeId", current,
                "queueSize", queue.size()
            )));
            
            // Find neighbors
            for (Edge edge : graph.getEdges()) {
                String neighbor = null;
                
                if (edge.getSource().equals(current)) {
                    neighbor = edge.getTarget();
                } else if (edge.getTarget().equals(current)) {
                    neighbor = edge.getSource();
                }
                
                if (neighbor != null && !visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                    parent.put(neighbor, current);
                    
                    steps.add(new AlgorithmStep("enqueue", Map.of(
                        "nodeId", neighbor,
                        "parent", current
                    )));
                }
            }
        }
        
        return steps;
    }
    
    // Helper methods
    private double heuristic(Graph graph, String from, String to) {
        Node fromNode = graph.getNodes().get(from);
        Node toNode = graph.getNodes().get(to);
        
        if (fromNode == null || toNode == null) {
            return 0.0;
        }
        
        // Euclidean distance heuristic
        double dx = toNode.getX() - fromNode.getX();
        double dy = toNode.getY() - fromNode.getY();
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    private List<String> reconstructPath(Map<String, String> cameFrom, String start, String end) {
        List<String> path = new ArrayList<>();
        String current = end;
        
        while (current != null) {
            path.add(0, current); // Add to beginning
            current = cameFrom.get(current);
        }
        
        // Verify path starts from start node
        if (!path.isEmpty() && !path.get(0).equals(start)) {
            return new ArrayList<>(); // Invalid path
        }
        
        return path;
    }
    
    private TreeNode buildTree(Map<String, Object> data) {
        // Build tree from data
        // Implementation depends on data format
        return new TreeNode("root");
    }
    
    private Graph buildGraph(Map<String, Object> data) {
        // Build graph from data
        Graph graph = new Graph();
        // Implementation depends on data format
        return graph;
    }
    
    // Tree traversal methods
    private void bfsTree(TreeNode root, List<String> order) {
        if (root == null) return;
        
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            order.add(node.value);
            
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    
    private void dfsTree(TreeNode root, List<String> order) {
        if (root == null) return;
        
        order.add(root.value);
        dfsTree(root.left, order);
        dfsTree(root.right, order);
    }
    
    private void inorderTree(TreeNode root, List<String> order) {
        if (root == null) return;
        
        inorderTree(root.left, order);
        order.add(root.value);
        inorderTree(root.right, order);
    }
    
    private void preorderTree(TreeNode root, List<String> order) {
        if (root == null) return;
        
        order.add(root.value);
        preorderTree(root.left, order);
        preorderTree(root.right, order);
    }
    
    private void postorderTree(TreeNode root, List<String> order) {
        if (root == null) return;
        
        postorderTree(root.left, order);
        postorderTree(root.right, order);
        order.add(root.value);
    }
    
    // Graph traversal methods
    private void bfsGraph(Graph graph, String start, List<String> order) {
        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        
        queue.offer(start);
        visited.add(start);
        
        while (!queue.isEmpty()) {
            String current = queue.poll();
            order.add(current);
            
            // Get neighbors
            for (Edge edge : graph.getEdges()) {
                String neighbor = null;
                if (edge.getSource().equals(current)) {
                    neighbor = edge.getTarget();
                } else if (edge.getTarget().equals(current)) {
                    neighbor = edge.getSource();
                }
                
                if (neighbor != null && !visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
    }
    
    private void dfsGraph(Graph graph, String start, List<String> order) {
        Set<String> visited = new HashSet<>();
        dfsGraphHelper(graph, start, visited, order);
    }
    
    private void dfsGraphHelper(Graph graph, String current, Set<String> visited, List<String> order) {
        visited.add(current);
        order.add(current);
        
        // Get neighbors
        for (Edge edge : graph.getEdges()) {
            String neighbor = null;
            if (edge.getSource().equals(current)) {
                neighbor = edge.getTarget();
            } else if (edge.getTarget().equals(current)) {
                neighbor = edge.getSource();
            }
            
            if (neighbor != null && !visited.contains(neighbor)) {
                dfsGraphHelper(graph, neighbor, visited, order);
            }
        }
    }
    
    // Helper classes
    private static class TreeNode {
        String value;
        TreeNode left;
        TreeNode right;
        
        TreeNode(String value) {
            this.value = value;
        }
    }
    
    private static class NodeDistance implements Comparable<NodeDistance> {
        String nodeId;
        double distance;
        
        NodeDistance(String nodeId, double distance) {
            this.nodeId = nodeId;
            this.distance = distance;
        }
        
        @Override
        public int compareTo(NodeDistance other) {
            return Double.compare(this.distance, other.distance);
        }
    }
}