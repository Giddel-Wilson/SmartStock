#!/bin/bash

echo "🌐 Starting SmartStock with Full Network Access..."
echo "================================================="

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🔍 Local IP detected: $LOCAL_IP"

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
lsof -ti :5174 | xargs kill -9 2>/dev/null || true
sleep 3

# Start backend with network binding
echo "🚀 Starting backend server with network access..."
cd backend
node server.js &
BACKEND_PID=$!
echo "📊 Backend PID: $BACKEND_PID"
cd ..

# Wait for backend
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend accessibility
echo "🧪 Testing backend accessibility..."
if curl -s -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend localhost: Working"
else
    echo "❌ Backend localhost: Failed"
fi

if curl -s -f http://$LOCAL_IP:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend network: Working"
else
    echo "❌ Backend network: Failed"
fi

# Start frontend with network access
echo "🌐 Starting frontend server with network access..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "📱 Frontend PID: $FRONTEND_PID"
cd ..

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
sleep 8

echo ""
echo "🎉 SmartStock Network Setup Complete!"
echo "===================================="
echo ""
echo "🖥️  PC Access:"
echo "   📊 http://localhost:5173/reports"
echo "   🔧 http://localhost:3001/api/health"
echo ""
echo "📱 Mobile/Network Access:"
echo "   📊 http://$LOCAL_IP:5173/reports (or :5174 if port conflict)"
echo "   🔧 http://$LOCAL_IP:3001/api/health"
echo ""
echo "🔍 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
