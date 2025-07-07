#!/bin/bash

echo "🔄 Force Restarting Backend Server for CORS Fix..."
echo "======================================================="

# Function to find and kill processes using port 3001
kill_port_3001() {
    echo "🔌 Checking port 3001..."
    local pids=$(lsof -ti :3001 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "   Found processes using port 3001: $pids"
        echo "   Force killing them..."
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "   Port 3001 is free"
    fi
}

# Force kill ALL node processes that might be running the backend
echo "🛑 Force stopping ALL backend processes..."
pkill -9 -f "node.*server" 2>/dev/null || true
pkill -9 -f "backend.*server" 2>/dev/null || true
pkill -9 -f "npm.*start" 2>/dev/null || true

# Kill anything using port 3001 (more thorough approach)
kill_port_3001
sleep 1
kill_port_3001  # Double check

# Final verification
if lsof -i :3001 >/dev/null 2>&1; then
    echo "❌ Port 3001 is still in use after cleanup attempts:"
    lsof -i :3001
    echo ""
    echo "🔧 Manual cleanup required. Run these commands:"
    echo "   lsof -ti :3001 | xargs kill -9"
    echo "   Then try starting the server again"
    exit 1
fi

echo "✅ Port 3001 is now free"

# Navigate to backend directory
echo "📁 Navigating to backend directory..."
cd backend || {
    echo "❌ Backend directory not found!"
    exit 1
}

# Show current .env FRONTEND_URL setting
echo "🔍 Current .env FRONTEND_URL setting:"
if [ -f ".env" ]; then
    grep "FRONTEND_URL" .env || echo "   FRONTEND_URL not found in .env"
else
    echo "   .env file not found!"
    exit 1
fi

# Start backend server
echo ""
echo "🚀 Starting backend server with updated CORS settings..."
echo "   This will pick up the new FRONTEND_URL=http://localhost:5173"
echo ""

# Start the server and capture output
node server.js &
BACKEND_PID=$!

echo "📊 Backend server started with PID: $BACKEND_PID"
echo "⏳ Waiting for server to initialize..."

# Wait for server to start up
sleep 4

# Test if server is responding
echo "🧪 Testing server endpoints..."

# Test health endpoint
if curl -s -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Health endpoint: WORKING"
    echo "📋 Response:"
    curl -s http://localhost:3001/api/health | json_pp 2>/dev/null || curl -s http://localhost:3001/api/health
else
    echo "❌ Health endpoint: FAILED"
    echo "🔍 Server may not have started properly"
fi

echo ""
echo "🧪 Testing CORS headers..."
curl -s -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3001/api/health \
     -v 2>&1 | grep -i "access-control" || echo "   No CORS headers found in preflight response"

echo ""
echo "🎉 Backend restart complete!"
echo "📊 Backend PID: $BACKEND_PID"
echo "🌐 Server URL: http://localhost:3001"
echo "🩺 Health Check: http://localhost:3001/api/health"
echo ""
echo "✨ Now refresh your browser to test the Reports page!"
echo "🔍 The CORS error should be resolved."
echo ""
echo "To stop the server: kill $BACKEND_PID"
