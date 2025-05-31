# 🚀 Quick Start Guide - Secure Audio Transcription

## Prerequisites
- Python 3.8+
- Node.js 16+
- ffmpeg installed
- OpenAI API key

## 1. Start Backend (Terminal 1)
```bash
# Install dependencies
pip install flask flask-cors openai werkzeug

# Run backend
python app_secure.py
```
Backend runs on: http://localhost:8001

## 2. Start Frontend (Terminal 2)
```bash
# Go to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start React app
npm start
```
Frontend runs on: http://localhost:3000

## 3. Use the App
1. Open http://localhost:3000 in your browser
2. Enter your OpenAI API key in the secure input field
3. Upload an audio file (drag & drop or click)
4. Watch real-time progress
5. Download transcription when complete

## Key Features
- ✅ No hardcoded API keys
- ✅ Adaptive processing (small files = direct, large files = compress + chunk)
- ✅ Maximum speed optimization
- ✅ Real-time progress tracking
- ✅ Supports files up to 2GB / 11+ hours

## Get Your API Key
Visit: https://platform.openai.com/api-keys

## Troubleshooting
- Port 8001 in use? Change it in app_secure.py last line
- ffmpeg not found? Install with `brew install ffmpeg` (macOS)
- API key error? Check it starts with "sk-" and has credits 