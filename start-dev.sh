#!/bin/bash

# SmartStock Development Startup Script
echo "🚀 Starting SmartStock Development Environment..."

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true

# Navigate to backend and start server
echo "📦 Starting Backend Server..."
cd "/Users/maintenance/Documents/SmartStock -m/backend"
node server.js &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Give backend time to start
sleep 3

# Navigate to frontend and start dev server
echo "🌐 Starting Frontend Server..."
cd "/Users/maintenance/Documents/SmartStock -m/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Give frontend time to start
sleep 5

echo "✅ SmartStock Development Environment Started!"
echo "📋 Services:"
echo "   - Backend:  http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo "   - Reports:  http://localhost:5173/reports"
echo ""
echo "🧪 Testing Reports API..."
cd "/Users/maintenance/Documents/SmartStock -m"
node test-reports.js

echo ""
echo "🛑 To stop all services, run: pkill -f 'node.*server.js' && pkill -f 'vite.*dev'"
echo "Press Ctrl+C to view logs or stop this script..."

# Keep script running to show logs
tail -f /dev/null
