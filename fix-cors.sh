#!/bin/bash

echo "🔄 Restarting Backend with CORS Fix..."

# Kill existing backend processes
echo "🛑 Stopping backend processes..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Navigate to backend and start
cd backend
echo "🚀 Starting backend with updated CORS settings..."
node server.js &

# Wait for startup and test
echo "⏳ Waiting for backend to start..."
sleep 3

# Test the health endpoint
echo "🧪 Testing health endpoint..."
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend is running and responding!"
    echo "🔧 CORS is now configured for http://localhost:5173"
    echo "📊 You can now refresh the Reports page"
else
    echo "❌ Backend failed to start properly"
    echo "📋 Check the console output above for errors"
fi
