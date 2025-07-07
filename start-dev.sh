#!/bin/bash

# Headnugget Development Environment Startup Script
# Starts both React frontend and FastAPI backend

echo "🚀 Starting Headnugget Development Environment"
echo "=============================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Check required dependencies
echo "🔍 Checking dependencies..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Node.js and npm are required but not installed"
    exit 1
fi

if ! command_exists mongod && ! port_in_use 27017; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   brew services start mongodb/brew/mongodb-community"
    echo "   or"
    echo "   mongod --config /usr/local/etc/mongod.conf"
    exit 1
fi

echo "✅ Dependencies check passed"

# Kill existing processes on our ports
echo "🧹 Cleaning up existing processes..."
if port_in_use 3000; then
    echo "   Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if port_in_use 8000; then
    echo "   Killing process on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

# Create Python virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo "📦 Setting up backend dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt >/dev/null 2>&1
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install >/dev/null 2>&1
fi

echo "🏗️  Starting services..."

# Start backend in background
echo "🔧 Starting FastAPI backend on http://localhost:8000..."
cd backend
source venv/bin/activate
python start.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "⚛️  Starting React frontend on http://localhost:3000..."
npm start &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

echo ""
echo "🎉 Headnugget Development Environment Started!"
echo "=============================================="
echo "📱 Frontend:      http://localhost:3000"
echo "🔧 Backend:       http://localhost:8000"
echo "📚 API Docs:      http://localhost:8000/docs"
echo "🔐 Demo Login:    demo@example.com / demo123"
echo ""
echo "📊 Services Running:"
echo "   React Frontend (PID: $FRONTEND_PID)"
echo "   FastAPI Backend (PID: $BACKEND_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait