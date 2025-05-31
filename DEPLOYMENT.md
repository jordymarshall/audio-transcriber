# 🚀 Deployment Guide

## 🏆 Option 1: Railway (Recommended - Easiest)

**Cost:** Free tier (500 hours/month), then $5/month  
**Why:** Supports Python + ffmpeg, easy GitHub integration, built for full-stack apps

### Steps:
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/jordymarshall/audio-transcriber.git
   git push -u origin master
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect Python and deploy!

3. **Set Environment Variables:**
   - In Railway dashboard, go to Variables tab
   - Add: `PORT=8001` (optional, will auto-detect)

**✅ Done! Your app will be live at: `yourapp.railway.app`**

---

## 🥈 Option 2: Render (Free Tier Available)

**Cost:** Free tier (limited), $7/month for better performance  
**Why:** Good free tier, supports Python + ffmpeg

### Steps:
1. **Push to GitHub** (same as above)

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New Web Service"
   - Connect your GitHub repo
   - Use these settings:
     - **Build Command:** `cd frontend && npm install && npm run build && cd .. && pip install -r requirements.txt`
     - **Start Command:** `python app_secure.py`

---

## 🥉 Option 3: Google Cloud Run (Pay-per-use)

**Cost:** ~$0-2/month for low usage  
**Why:** Cheapest for occasional use, scales to zero

### Steps:
1. Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Build frontend
COPY frontend/package*.json frontend/
RUN cd frontend && npm install
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy backend
COPY . .

CMD ["python", "app_secure.py"]
```

2. Deploy with gcloud CLI or Cloud Console

---

## 🏅 Option 4: DigitalOcean App Platform

**Cost:** $5/month  
**Why:** Reliable, good for production

### Steps:
1. Push to GitHub
2. Go to DigitalOcean → App Platform
3. Connect GitHub repo
4. Use detected Python settings

---

## 🔧 Pre-deployment Checklist

- [ ] Environment variables configured (no hardcoded API keys)
- [ ] Frontend built and tested
- [ ] .gitignore excludes sensitive files
- [ ] requirements.txt updated
- [ ] App runs locally on `0.0.0.0:PORT`

---

## 📱 Testing Your Deployed App

1. Visit your deployed URL
2. Enter OpenAI API key
3. Upload a small test audio file
4. Verify transcription works

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Railway** | 500hrs/month | $5/month | Easiest setup |
| **Render** | Limited | $7/month | Good free tier |
| **Google Cloud Run** | Generous | Pay-per-use | Low usage |
| **DigitalOcean** | None | $5/month | Production |

## 🆘 Troubleshooting

**Build fails:**
- Check `nixpacks.toml` includes ffmpeg
- Verify all dependencies in `requirements.txt`

**API calls fail:**
- Check CORS settings
- Verify API endpoints match frontend

**ffmpeg not found:**
- Ensure platform supports binary packages
- Check build logs for ffmpeg installation

---

**Need help?** Check platform-specific docs or contact Jordan on [LinkedIn](https://www.linkedin.com/in/jordanmarshalluwo/)! 