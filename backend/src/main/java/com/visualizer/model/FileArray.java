package com.visualizer.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.*;

@Data
public class FileArray {

    @Data
    @AllArgsConstructor
    public static class Element {
        private StoredFile file;
        private String elementId;
        private int index;

        public Element(StoredFile file, int index) {
            this.file = file;
            this.elementId = UUID.randomUUID().toString();
            this.index = index;
        }
    }

    @Data
    @AllArgsConstructor
    public static class ElementSnapshot {
        private String elementId;
        private String filename;
        private String size;
        private String contentType;
        private int index;
    }

    @Data
    @AllArgsConstructor
    public static class VisualizationStep {
        private String operation;
        private String description;
        private List<ElementSnapshot> currentState;
        private String highlightedElementId;
        private Map<String, Object> metadata;
    }

    private List<Element> array;
    private int capacity;
    private List<VisualizationStep> steps;

    public FileArray(int capacity) {
        this.array = new ArrayList<>();
        this.capacity = capacity;
        this.steps = new ArrayList<>();
    }

    // ===== INSERT =====
    public List<VisualizationStep> insert(StoredFile file, int index) {
        steps.clear();
        if (array.size() >= capacity) {
            steps.add(new VisualizationStep(
                "OVERFLOW",
                "⛔ Array Overflow! Capacity: " + capacity,
                convertSnapshots(), null,
                Map.of("isFull", true)
            ));
            return steps;
        }

        // Step 1: Create Element
        Element newElement = new Element(file, Math.min(index, array.size()));
        steps.add(new VisualizationStep(
            "CREATE_ELEMENT",
            "📦 Creating new element for: " + file.getFilename(),
            convertSnapshots(), null,
            Map.of("targetIndex", index)
        ));

        // Step 2: Insert or Append
        if (index >= array.size()) {
            array.add(newElement);
            newElement.setIndex(array.size() - 1);
            steps.add(new VisualizationStep(
                "APPEND",
                "✨ Added to end at index " + (array.size() - 1),
                convertSnapshots(), newElement.getElementId(),
                Map.of("size", array.size())
            ));
        } else {
            array.add(index, newElement);
            reindex();
            steps.add(new VisualizationStep(
                "SHIFT_RIGHT",
                "➡️ Shifting elements to make space",
                convertSnapshots(), newElement.getElementId(),
                Map.of("size", array.size())
            ));
        }

        steps.add(new VisualizationStep(
            "COMPLETE",
            "✅ Insert complete! Size: " + array.size(),
            convertSnapshots(), newElement.getElementId(),
            Map.of("count", array.size())
        ));
        return new ArrayList<>(steps);
    }

    // ===== DELETE =====
    public List<VisualizationStep> delete(int index) {
        steps.clear();
        if (array.isEmpty()) {
            steps.add(new VisualizationStep(
                "EMPTY",
                "❌ Cannot delete, array empty",
                convertSnapshots(), null,
                Map.of()
            ));
            return steps;
        }
        if (index < 0 || index >= array.size()) {
            steps.add(new VisualizationStep(
                "INVALID_INDEX",
                "⚠️ Invalid index: " + index,
                convertSnapshots(), null,
                Map.of()
            ));
            return steps;
        }

        Element target = array.get(index);
        steps.add(new VisualizationStep(
            "SELECT",
            "🗑️ Selecting element at index " + index + ": " + target.getFile().getFilename(),
            convertSnapshots(), target.getElementId(),
            Map.of("index", index)
        ));

        array.remove(index);
        reindex();

        steps.add(new VisualizationStep(
            "SHIFT_LEFT",
            "⬅️ Shifting elements left after removal",
            convertSnapshots(), null,
            Map.of("size", array.size())
        ));
        steps.add(new VisualizationStep(
            "COMPLETE",
            "✅ Deletion complete! Size: " + array.size(),
            convertSnapshots(), null,
            Map.of("count", array.size())
        ));
        return new ArrayList<>(steps);
    }

    // ===== SEARCH =====
    public List<VisualizationStep> search(String filename) {
        steps.clear();
        if (array.isEmpty()) {
            steps.add(new VisualizationStep("EMPTY", "❌ Array empty", null, null, Map.of()));
            return steps;
        }

        for (int i = 0; i < array.size(); i++) {
            Element e = array.get(i);
            steps.add(new VisualizationStep(
                "COMPARE",
                "🔍 Comparing index " + i + " (" + e.getFile().getFilename() + ")",
                convertSnapshots(), e.getElementId(), Map.of("index", i)
            ));

            if (e.getFile().getFilename().equals(filename)) {
                steps.add(new VisualizationStep(
                    "FOUND",
                    "🎯 Found file at index " + i,
                    convertSnapshots(), e.getElementId(),
                    Map.of("index", i)
                ));
                return steps;
            }
        }
        steps.add(new VisualizationStep(
            "NOT_FOUND",
            "❌ File not found: " + filename,
            convertSnapshots(), null, Map.of()
        ));
        return steps;
    }

    // ===== ACCESS =====
    public List<VisualizationStep> access(int index) {
        steps.clear();
        if (index < 0 || index >= array.size()) {
            steps.add(new VisualizationStep(
                "INVALID_INDEX",
                "⚠️ Invalid access index: " + index,
                convertSnapshots(), null,
                Map.of()
            ));
            return steps;
        }
        Element e = array.get(index);
        steps.add(new VisualizationStep(
            "ACCESS",
            "⚡ Access element at index " + index + ": " + e.getFile().getFilename(),
            convertSnapshots(), e.getElementId(),
            Map.of("file", e.getFile().getFilename())
        ));
        return steps;
    }

    public List<VisualizationStep> resize(int newCap) {
        steps.clear();
        capacity = newCap;
        if (array.size() > newCap) array = new ArrayList<>(array.subList(0, newCap));
        steps.add(new VisualizationStep(
            "RESIZE",
            "⚙️ Resized array to " + newCap,
            convertSnapshots(), null,
            Map.of("capacity", newCap)
        ));
        return steps;
    }

    private List<ElementSnapshot> convertSnapshots() {
        List<ElementSnapshot> snaps = new ArrayList<>();
        for (Element e : array) {
            snaps.add(new ElementSnapshot(
                e.getElementId(),
                e.getFile().getFilename(),
                e.getFile().getSizeFormatted(),
                e.getFile().getContentType(),
                e.getIndex()
            ));
        }
        return snaps;
    }

    private void reindex() {
        for (int i = 0; i < array.size(); i++) {
            array.get(i).setIndex(i);
        }
    }

    public void clear() { array.clear(); }

    public int getSize() { return array.size(); }
    public int getCapacity() { return capacity; }
    public boolean isEmpty() { return array.isEmpty(); }

    public List<StoredFile> getAllFiles() {
        List<StoredFile> files = new ArrayList<>();
        for (Element e : array) files.add(e.getFile());
        return files;
    }
}