#!/bin/bash

echo "🚀 Starting Jordan's Audio Transcriber locally..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start backend in background
echo "Starting Flask backend on port 8001..."
python app_secure.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend on port 3000..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait

# Clean up background processes
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "�� Servers stopped" 