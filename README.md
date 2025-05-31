# 🎵 Audio Transcription Service - Free First Transcription + $1.99/Month

A modern, high-performance audio transcription service with **Google OAuth authentication**, featuring **free first transcription** and then $1.99/month for unlimited transcriptions. Built with React TypeScript frontend and Flask backend.

## ✨ Features

- **🎁 Free First Transcription**: Try our service completely free with your first transcription
- **🔐 Google OAuth Login**: Simple, secure signup with your Google account
- **💎 $1.99/Month Subscription**: Unlimited transcriptions after your free trial
- **🚀 Maximum Speed Processing**: Using latest GPT-4o-mini transcription model (~$0.16/hour)
- **📱 Modern UI**: Beautiful React TypeScript frontend with Google authentication
- **📊 Real-time Progress**: Live progress tracking with detailed status updates
- **🎯 Optimized Performance**: Multi-threaded compression and parallel API calls
- **📁 Large File Support**: Handle files up to 500MB and 11+ hours long
- **💾 Auto Download**: Automatic transcription file download when complete
- **💳 Secure Payments**: Stripe integration for safe payment processing

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Google OAuth (@react-oauth/google)
- Tailwind CSS for styling
- Stripe Elements for payments
- Axios for API communication
- Real-time progress tracking

### Backend
- Flask with Python
- Google OAuth 2.0 authentication
- OpenAI gpt-4o-mini-transcribe (cheapest model at ~$0.16/hour)
- ffmpeg for audio processing
- Multi-threaded parallel processing
- Stripe for payment processing
- User management with JSON storage

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- ffmpeg
- Google Cloud account (for OAuth)
- Stripe account (for payment processing)
- OpenAI API key (for the developer)

### Backend Setup

1. **Create a `.env` file** with your API keys:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Google OAuth Configuration  
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Optional: Port configuration (default: 8001)
PORT=8001
```

2. **Set up Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized origins: `http://localhost:3000`, `http://localhost:8001`
   - Add redirect URIs: `http://localhost:3000`, `http://localhost:8001`
   - Copy the Client ID to your `.env` file

3. **Set up Stripe**:
   - Create account at [stripe.com](https://stripe.com)
   - Get your test API keys from the dashboard
   - Add them to your `.env` file

4. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

5. **Install ffmpeg** (if not already installed):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

6. **Start the Flask backend**:
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
2. **Sign up with Google**: Click "Sign up with Google" for instant account creation
3. **Upload your first file FREE**: Drag and drop or select an audio file
4. **Watch real-time progress** through:
   - File compression (for files > 25MB)
   - Audio chunking (adaptive based on file size)
   - Parallel transcription
5. **Download your transcription** when complete
6. **Subscribe for more**: After your free transcription, subscribe for $1.99/month for unlimited access

## ⚡ Performance & Cost Optimization

### Using GPT-4o-mini-transcribe
- **Cost**: ~$0.16 per hour of audio (80% cheaper than whisper-1)
- **Quality**: Excellent transcription quality
- **Speed**: Fast processing with parallel chunks

### Free First Transcription + Subscription Model
- **First transcription**: Completely FREE for all new users
- **After free trial**: $1.99/month for unlimited transcriptions
- **All inclusive**: We handle all API costs
- **Cancel anytime**: No long-term commitment

### Adaptive Processing Strategy
- **Small files (< 25MB)**: Direct transcription without compression
- **Medium files (25-100MB)**: Compression + 10-minute chunks + 15 workers
- **Large files (> 100MB)**: Aggressive compression + 5-minute chunks + 20 workers

### Expected Processing Times
- **Small files** (< 25MB): 1-2 minutes (direct processing)
- **Medium files** (25-100MB): 3-5 minutes  
- **Large files** (100MB-500MB): 5-15 minutes

## 👤 User Authentication Flow

1. **Google OAuth Signup**: Users sign up instantly with Google account
2. **Free First Transcription**: New users get one free transcription
3. **Subscription Prompt**: After free transcription, users are prompted to subscribe
4. **Monthly Billing**: $1.99/month charged via Stripe for unlimited access
5. **User Dashboard**: Track transcription count and subscription status

## 📁 Project Structure

```
├── app_secure.py         # Flask backend server with Google OAuth
├── .env                  # API keys (create this file)
├── users.json           # User data storage (auto-created)
├── requirements.txt      # Python dependencies
├── frontend/
│   ├── package.json      # Node.js dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   ├── tsconfig.json     # TypeScript configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx      # Authenticated file upload
│   │   │   ├── LoginPage.tsx       # Google OAuth login
│   │   │   ├── MainApp.tsx         # Main authenticated app
│   │   │   ├── PaymentForm.tsx     # Stripe payment form
│   │   │   ├── ProgressTracker.tsx # Real-time progress
│   │   │   └── UserProfile.tsx     # User info & logout
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Authentication state management
│   │   ├── types.ts      # TypeScript interfaces
│   │   ├── App.tsx       # Main React component with auth routing
│   │   ├── index.tsx     # React entry point
│   │   └── index.css     # Tailwind styles
│   └── public/
│       └── index.html    # HTML template
├── uploads/              # Temporary uploaded files
├── outputs/              # Generated transcriptions
└── users.json           # User accounts and subscription data
```

## 🔐 Security Features

- **Google OAuth 2.0**: Industry-standard authentication
- **No user API keys**: All AI processing handled server-side
- **Secure payments**: Stripe handles all payment data
- **File cleanup**: Uploaded files deleted after processing
- **Environment variables**: Sensitive keys stored in `.env`
- **User data protection**: Minimal data collection and secure storage
- **HTTPS ready**: Designed for secure deployment

## 🔧 Configuration

### Audio Settings
- **Model**: gpt-4o-mini-transcribe (latest and cheapest)
- **Compression**: AAC codec, 24-32kbps, mono
- **Chunk Duration**: 5-10 minutes (adaptive)
- **Parallel Workers**: 5-20 (based on file size)
- **File Size Limit**: 500MB per file

### Authentication Settings
- **Google OAuth**: Required for all users
- **Session Management**: JWT-based authentication
- **User Storage**: JSON file (easily upgradeable to database)

### Pricing Settings
- **Free Trial**: First transcription free for new users
- **Monthly Price**: $1.99/month
- **Currency**: USD
- **Billing**: Monthly recurring via Stripe

## 🐛 Troubleshooting

### Common Issues

**"Google OAuth is not properly configured"**
- Check that `GOOGLE_CLIENT_ID` is set in `.env`
- Verify the Client ID is correct from Google Cloud Console
- Ensure authorized origins include your localhost URLs

**"Service temporarily unavailable"**
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify the API key is valid and has credits

**"Authentication required"**
- Make sure you're signed in with Google
- Try refreshing the page or logging out and back in

**"Upload failed"**
- Check file size (max 500MB)
- Ensure file is a valid audio format (MP3, WAV, M4A, OGG)
- Verify backend is running on port 8001

**Payment issues**
- Verify Stripe keys in `.env`
- Check Stripe dashboard for webhook configuration
- Ensure you're using test mode for development

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions on platforms like Railway, Render, or Google Cloud Run.

**Important for deployment:**
- Set production URLs in Google OAuth settings
- Use production Stripe keys
- Set environment variables on your hosting platform
- Ensure HTTPS for OAuth callbacks

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
2. Set up Google OAuth in Google Cloud Console
3. Create a Stripe account at https://stripe.com
4. Set up your `.env` file with all required keys
5. Consider using Railway or Render for easy deployment

---

**Happy transcribing!** 🎉 Built with ❤️ by [Jordan Marshall](https://www.linkedin.com/in/jordanmarshalluwo/)

## 🎁 Special Feature: Free First Transcription

Every new user gets their **first transcription completely FREE** - no credit card required for signup! This allows users to:

- ✅ Test the quality of our AI transcription
- ✅ Experience the fast processing speeds  
- ✅ See the user-friendly interface
- ✅ Try before committing to a subscription

After the free transcription, users can subscribe for just $1.99/month for unlimited access! 