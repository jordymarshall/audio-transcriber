# 🎵 Audio Transcription Service - Secure Version

A modern, high-performance audio transcription service with React TypeScript frontend and Flask backend, optimized for maximum speed processing. **API keys are securely provided through the frontend interface.**

## ✨ Features

- **🔐 Secure API Key Handling**: Enter your OpenAI API key in the frontend - no hardcoding
- **🚀 Maximum Speed Processing**: Adaptive strategy based on file size
- **📱 Modern UI**: Beautiful React TypeScript frontend with drag & drop
- **📊 Real-time Progress**: Live progress tracking with detailed status updates
- **🎯 Optimized Performance**: Multi-threaded compression and parallel API calls
- **📁 Large File Support**: Handle files up to 2GB and 11+ hours long
- **💾 Auto Download**: Automatic transcription file download when complete

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Axios for API communication
- Real-time progress tracking
- Secure API key input with local storage option

### Backend
- Flask with Python
- OpenAI Whisper API (gpt-4o-transcribe)
- ffmpeg for audio processing
- Multi-threaded parallel processing
- API key passed per request

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- ffmpeg

### Backend Setup

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Install ffmpeg** (if not already installed):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

3. **Start the Flask backend**:
```bash
python app_secure.py
```
Backend will run on `http://localhost:8001`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the React development server**:
```bash
npm start
```
Frontend will run on `http://localhost:3000`

## 🚀 Usage

1. **Open your browser** to `http://localhost:3000`
2. **Enter your OpenAI API key** in the secure input field
   - Get your key from: https://platform.openai.com/api-keys
   - Optionally save to browser local storage for convenience
3. **Upload an audio file** by:
   - Dragging and dropping onto the upload area
   - Clicking to browse and select a file
4. **Watch real-time progress** through:
   - File compression (for files > 25MB)
   - Audio chunking (adaptive based on file size)
   - Parallel transcription
5. **Download your transcription** when complete

## ⚡ Performance Optimizations

### Adaptive Processing Strategy
- **Small files (< 25MB)**: Direct transcription without compression
- **Medium files (25-100MB)**: Compression + 10-minute chunks + 15 workers
- **Large files (> 100MB)**: Aggressive compression + 5-minute chunks + 20 workers

### Speed Features
- **Smart Compression**: Only compress when needed
- **Adaptive Chunks**: Optimal chunk size based on file size
- **Parallel Processing**: Up to 20 simultaneous workers
- **Multi-threading**: Uses all CPU cores for compression

### Expected Processing Times
- **Small files** (< 25MB): 1-2 minutes (direct processing)
- **Medium files** (25-100MB): 3-5 minutes  
- **Large files** (100MB-2GB): 5-15 minutes

## 📁 Project Structure

```
├── app_secure.py         # Secure Flask backend server
├── Transcribe.py         # CLI script (requires API key)
├── requirements.txt      # Python dependencies
├── frontend/
│   ├── package.json      # Node.js dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   ├── tsconfig.json     # TypeScript configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx      # Drag & drop with API key input
│   │   │   └── ProgressTracker.tsx # Real-time progress
│   │   ├── types.ts      # TypeScript interfaces
│   │   ├── App.tsx       # Main React component
│   │   ├── index.tsx     # React entry point
│   │   └── index.css     # Tailwind styles
│   └── public/
│       └── index.html    # HTML template
├── uploads/              # Temporary uploaded files
└── outputs/              # Generated transcriptions
```

## 🔐 Security Features

- **No hardcoded API keys**: All API keys provided through frontend
- **Per-request authentication**: Each upload includes its own API key
- **Local storage option**: Save API key in browser (optional)
- **API key validation**: Checks format before sending to server
- **Secure transmission**: API key sent with file upload via HTTPS

## 🔧 Configuration

### Audio Settings
- **Compression**: AAC codec, 24-32kbps, mono
- **Chunk Duration**: 5-10 minutes (adaptive)
- **Parallel Workers**: 5-20 (based on file size)
- **File Size Limit**: 2GB per file

### API Settings
- **Model**: gpt-4o-transcribe (latest OpenAI Whisper)
- **Response Format**: Plain text
- **Max File Size**: 25MB per chunk (after compression)

## 🐛 Troubleshooting

### Common Issues

**"API key is required"**
- Make sure to enter your OpenAI API key in the frontend
- Check that the key starts with "sk-"

**"Invalid API key"**
- Verify your API key at https://platform.openai.com/api-keys
- Ensure you have credits in your OpenAI account

**"ffmpeg not found"**
- Make sure ffmpeg is installed and in your PATH
- On macOS: `brew install ffmpeg`

**"Upload failed"**
- Check file size (max 2GB)
- Ensure file is a valid audio format (MP3, WAV, M4A, OGG)
- Verify backend is running on port 8001

## 🚀 Running the CLI Version

The command-line version (`Transcribe.py`) also requires an API key:

```bash
# Option 1: Set environment variable
export OPENAI_API_KEY='your-api-key'
python Transcribe.py

# Option 2: Pass as argument
python Transcribe.py 'your-api-key'
```

## 📊 Supported Audio Formats

- **MP3** (recommended)
- **WAV** 
- **M4A**
- **OGG**
- **FLAC**
- **MP4** (audio only)

## 🎯 Performance Tips

1. **Use MP3 format** for best compression ratio
2. **Mono audio** processes faster than stereo
3. **Lower bitrate** source files compress better
4. **Stable internet** for faster API calls
5. **Close other apps** for maximum CPU utilization

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Happy transcribing!** 🎉 