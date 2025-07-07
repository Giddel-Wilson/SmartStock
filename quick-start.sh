#!/bin/bash

echo "🚀 Starting SmartStock Development Environment..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true
sleep 2

# Start backend server
echo "📦 Starting Backend Server..."
cd backend
if [ ! -f "server.js" ]; then
    echo "❌ Backend server.js not found!"
    exit 1
fi

node server.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if check_port 3001; then
        echo "✅ Backend server is running on port 3001"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend server failed to start"
        exit 1
    fi
    sleep 1
done

# Start frontend server
echo "🌐 Starting Frontend Server..."
cd ../frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..15}; do
    if check_port 5173; then
        echo "✅ Frontend server is running on port 5173"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Frontend server failed to start"
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 SmartStock is now running!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "To stop all servers, run: pkill -f 'node.*server.js' && pkill -f 'vite.*dev'"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap 'echo "🛑 Stopping servers..."; pkill -f "node.*server.js"; pkill -f "vite.*dev"; exit 0' INT
while true; do
    sleep 1
done
