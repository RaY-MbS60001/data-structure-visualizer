#  Data Structure Visualizer

Interactive visualization tool for learning data structures through real-time file uploads.

## Features

-  HashMap visualization with collision handling
-  Binary Tree sorted by file size
-  Linked List sequential storage
-  Real-time WebSocket updates
-  50MB storage quota per user
-  Beautiful animations

## Quick Start

\\\ash
# Backend
cd backend
mvn clean install
mvn spring-boot:run

# Frontend (new terminal)
cd frontend
python -m http.server 3000
# Or use Live Server in VS Code

# Open browser
http://localhost:3000/index.html
\\\

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.1, WebSocket
- **Frontend:** HTML5 Canvas, JavaScript ES6+
- **Build:** Maven

## License

MIT License
