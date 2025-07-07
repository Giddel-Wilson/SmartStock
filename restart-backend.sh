#!/bin/bash

echo "🔄 Restarting SmartStock Backend Server..."

# Kill any existing backend processes
echo "🧹 Stopping existing backend processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Check if port 3001 is still in use
if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Port 3001 is still in use. Trying to force kill..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Navigate to backend directory
cd backend

# Check if required files exist
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found in backend directory"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit backend/.env with your database credentials"
    else
        echo "❌ No .env.example found either"
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start the backend server
echo "🚀 Starting backend server..."
node server.js &
BACKEND_PID=$!

echo "📊 Backend started with PID: $BACKEND_PID"

# Wait for server to start and test endpoints
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend server is running and responding!"
        echo "🔗 Health check: http://localhost:3001/api/health"
        
        # Test a few key endpoints
        echo "🧪 Testing key endpoints..."
        
        if curl -s http://localhost:3001/api/categories >/dev/null 2>&1; then
            echo "✅ Categories endpoint: Working"
        else
            echo "⚠️  Categories endpoint: May require authentication"
        fi
        
        echo ""
        echo "🎉 Backend server is ready!"
        echo "📋 You can now refresh the Reports page in your browser"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Backend server failed to start or is not responding"
        echo "📋 Check the console output above for errors"
        echo "🔍 You can also check the logs with: cd backend && tail -f server.log"
        exit 1
    fi
    
    sleep 1
done

echo ""
echo "📈 Backend Status: RUNNING"
echo "🌐 Server URL: http://localhost:3001"
echo "🩺 Health Check: http://localhost:3001/api/health"
echo ""
echo "To stop the server: pkill -f 'node.*server.js'"
