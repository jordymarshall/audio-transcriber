# ⚡ Quick Deployment Guide

## 🎯 Fastest Way to Deploy (5 minutes)

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/jordymarshall/audio-transcriber.git
git push -u origin master
```

### 2. **Deploy on Railway** 
1. Go to **[railway.app](https://railway.app)**
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `audio-transcriber` repository
5. **Done!** ✅

Railway will automatically:
- ✅ Detect Python app
- ✅ Install ffmpeg
- ✅ Build React frontend  
- ✅ Deploy everything
- ✅ Give you a live URL

### 3. **Your app is live!** 🎉
- URL: `https://yourapp.railway.app`
- Cost: **FREE** for 500 hours/month

---

## 💰 Cost Breakdown

| Usage | Railway Cost |
|-------|--------------|
| **Light usage** (< 500 hrs/month) | **FREE** |
| **Regular usage** | **$5/month** |
| **Heavy usage** | **$5-20/month** |

---

## 🔧 Alternative: Render (Also Free)

If Railway doesn't work:

1. **[render.com](https://render.com)** → Sign up with GitHub
2. **"New Web Service"** → Connect your repo
3. **Build Command:** 
   ```bash
   cd frontend && npm install && npm run build && cd .. && pip install -r requirements.txt
   ```
4. **Start Command:** `python app_secure.py`

---

## 🚨 Before You Deploy

Make sure you have:
- ✅ Pushed all code to GitHub
- ✅ Your `.gitignore` excludes sensitive files
- ✅ No hardcoded API keys in your code

---

## 🎯 Test Your Deployed App

1. Visit your live URL
2. Enter OpenAI API key
3. Upload small audio file (< 5MB first)
4. Verify transcription works

---

**🆘 Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides or contact [Jordan on LinkedIn](https://www.linkedin.com/in/jordanmarshalluwo/)! 