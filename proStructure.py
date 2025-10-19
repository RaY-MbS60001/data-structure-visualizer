import os

def print_tree(start_path, indent=""):
    for entry in sorted(os.listdir(start_path)):
        full_path = os.path.join(start_path, entry)
        print(f"{indent}├── {entry}")
        if os.path.isdir(full_path):
            print_tree(full_path, indent + "│   ")

# Fix the path with one of the correct formats:
print_tree(r"C:\Users\Mabasos\Desktop\data-structure-visualizer")
