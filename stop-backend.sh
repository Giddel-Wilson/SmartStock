#!/bin/bash

echo "🛑 Stopping All SmartStock Backend Processes..."
echo "=============================================="

# Function to find and kill processes using port 3001
kill_port_3001() {
    local pids=$(lsof -ti :3001 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "🔍 Found processes using port 3001: $pids"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
        return 0
    else
        return 1
    fi
}

# Kill node server processes
echo "🔄 Killing node server processes..."
pkill -9 -f "node.*server" 2>/dev/null || true
pkill -9 -f "backend.*server" 2>/dev/null || true
pkill -9 -f "npm.*start" 2>/dev/null || true

# Kill processes using port 3001 with multiple attempts
echo "🔌 Freeing up port 3001..."
for i in {1..3}; do
    if kill_port_3001; then
        echo "   Attempt $i: Killed processes"
        sleep 1
    else
        echo "   Attempt $i: No processes found"
        break
    fi
done

# Final check
if lsof -i :3001 >/dev/null 2>&1; then
    echo "❌ Port 3001 is still occupied:"
    lsof -i :3001
    echo ""
    echo "🔧 Try this manual command:"
    echo "   sudo lsof -ti :3001 | xargs sudo kill -9"
else
    echo "✅ Port 3001 is now free!"
    echo ""
    echo "🚀 You can now start the backend server:"
    echo "   cd backend && npm start"
    echo "   OR"
    echo "   cd backend && node server.js"
fi
