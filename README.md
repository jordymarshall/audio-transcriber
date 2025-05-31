# 🎵 Audio Transcription Service - Monthly Subscription

A modern, high-performance audio transcription service with React TypeScript frontend and Flask backend, featuring Stripe-powered monthly subscriptions. **No API keys required from users - everything is handled for you!**

## ✨ Features

- **💎 Monthly Subscription**: Just $1.99/month for unlimited transcriptions
- **🔐 No API Keys Needed**: We handle all the AI processing for you
- **🚀 Maximum Speed Processing**: Using latest GPT-4o-mini transcription model
- **📱 Modern UI**: Beautiful React TypeScript frontend with drag & drop
- **📊 Real-time Progress**: Live progress tracking with detailed status updates
- **🎯 Optimized Performance**: Multi-threaded compression and parallel API calls
- **📁 Large File Support**: Handle files up to 500MB and 11+ hours long
- **💾 Auto Download**: Automatic transcription file download when complete
- **💳 Secure Payments**: Stripe integration for safe payment processing

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Stripe Elements for payments
- Axios for API communication
- Real-time progress tracking

### Backend
- Flask with Python
- OpenAI gpt-4o-mini-transcribe (cheapest model at ~$0.16/hour)
- ffmpeg for audio processing
- Multi-threaded parallel processing
- Stripe for payment processing
- MongoDB for user management

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- ffmpeg
- Stripe account (for payment processing)
- OpenAI API key (for the developer)

### Backend Setup

1. **Create a `.env` file** with your API keys:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Stripe Configuration  
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

2. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

3. **Install ffmpeg** (if not already installed):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

4. **Start the Flask backend**:
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
2. **Upload an audio file** by:
   - Dragging and dropping onto the upload area
   - Clicking to browse and select a file
3. **Subscribe if needed**: First-time users will be prompted to subscribe for $1.99/month
4. **Watch real-time progress** through:
   - File compression (for files > 25MB)
   - Audio chunking (adaptive based on file size)
   - Parallel transcription
5. **Download your transcription** when complete

## ⚡ Performance & Cost Optimization

### Using GPT-4o-mini-transcribe
- **Cost**: ~$0.16 per hour of audio (80% cheaper than whisper-1)
- **Quality**: Excellent transcription quality
- **Speed**: Fast processing with parallel chunks

### Adaptive Processing Strategy
- **Small files (< 25MB)**: Direct transcription without compression
- **Medium files (25-100MB)**: Compression + 10-minute chunks + 15 workers
- **Large files (> 100MB)**: Aggressive compression + 5-minute chunks + 20 workers

### Expected Processing Times
- **Small files** (< 25MB): 1-2 minutes (direct processing)
- **Medium files** (25-100MB): 3-5 minutes  
- **Large files** (100MB-500MB): 5-15 minutes

## 💰 Pricing Model

- **Monthly Subscription**: $1.99/month
- **Unlimited Transcriptions**: No per-file or per-minute charges
- **All Inclusive**: We handle all API costs
- **Cancel Anytime**: No long-term commitment

## 📁 Project Structure

```
├── app_secure.py         # Flask backend server
├── .env                  # API keys (create this file)
├── requirements.txt      # Python dependencies
├── frontend/
│   ├── package.json      # Node.js dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   ├── tsconfig.json     # TypeScript configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx      # Drag & drop upload
│   │   │   ├── PaymentForm.tsx     # Stripe payment form
│   │   │   └── ProgressTracker.tsx # Real-time progress
│   │   ├── types.ts      # TypeScript interfaces
│   │   ├── App.tsx       # Main React component
│   │   ├── index.tsx     # React entry point
│   │   └── index.css     # Tailwind styles
│   └── public/
│       └── index.html    # HTML template
├── uploads/              # Temporary uploaded files
├── outputs/              # Generated transcriptions
└── usage_tracking.json   # User subscription data
```

## 🔐 Security Features

- **No user API keys**: All AI processing handled server-side
- **Secure payments**: Stripe handles all payment data
- **File cleanup**: Uploaded files deleted after processing
- **Environment variables**: Sensitive keys stored in `.env`
- **HTTPS ready**: Designed for secure deployment

## 🔧 Configuration

### Audio Settings
- **Model**: gpt-4o-mini-transcribe (latest and cheapest)
- **Compression**: AAC codec, 24-32kbps, mono
- **Chunk Duration**: 5-10 minutes (adaptive)
- **Parallel Workers**: 5-20 (based on file size)
- **File Size Limit**: 500MB per file

### Stripe Settings
- **Price**: $1.99/month
- **Currency**: USD
- **Billing**: Monthly recurring

## 🐛 Troubleshooting

### Common Issues

**"Service temporarily unavailable"**
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify the API key is valid

**"ffmpeg not found"**
- Make sure ffmpeg is installed and in your PATH
- On macOS: `brew install ffmpeg`

**"Upload failed"**
- Check file size (max 500MB)
- Ensure file is a valid audio format (MP3, WAV, M4A, OGG)
- Verify backend is running on port 8001

**Payment issues**
- Verify Stripe keys in `.env`
- Check Stripe dashboard for webhook configuration

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions on platforms like Railway, Render, or Google Cloud Run.

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

## 👨‍💻 Developer Setup

If you're deploying this service:

1. Get an OpenAI API key from https://platform.openai.com
2. Create a Stripe account at https://stripe.com
3. Set up your `.env` file with all required keys
4. Consider using Railway or Render for easy deployment

---

**Happy transcribing!** 🎉 Built with ❤️ by [Jordan Marshall](https://www.linkedin.com/in/jordanmarshalluwo/) 