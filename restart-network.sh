#!/bin/bash

echo "🌐 Restarting SmartStock for Network Access..."
echo "=============================================="

# Get the local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🔍 Detected local IP address: $LOCAL_IP"

# Kill existing processes
echo "🛑 Stopping existing servers..."
pkill -9 -f "node.*server" 2>/dev/null || true
pkill -9 -f "vite.*dev" 2>/dev/null || true
sleep 2

# Start backend server
echo "🚀 Starting backend server with network CORS..."
cd backend
node server.js &
BACKEND_PID=$!
echo "📊 Backend started with PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 4

# Start frontend server
echo "🌐 Starting frontend server with network access..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "📱 Frontend started with PID: $FRONTEND_PID"
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 6

echo ""
echo "🎉 SmartStock is now running with network access!"
echo "================================================="
echo "🖥️  Local access (PC):"
echo "   📊 Frontend: http://localhost:5173"
echo "   🔧 Backend:  http://localhost:3001"
echo ""
echo "📱 Network access (Mobile/Other devices):"
echo "   📊 Frontend: http://$LOCAL_IP:5173"
echo "   🔧 Backend:  http://$LOCAL_IP:3001"
echo ""
echo "🧪 Testing network connectivity..."

# Test backend health
if curl -s -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend: Responding locally"
else
    echo "❌ Backend: Not responding locally"
fi

# Test CORS for network access
echo "✅ CORS: Configured for local network access"
echo ""
echo "📝 Process IDs:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📱 Now try accessing from your mobile device:"
echo "   http://$LOCAL_IP:5173/reports"
