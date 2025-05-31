# 💳 Stripe Payment Setup Guide

## Overview
Your Audio Transcriber now includes Stripe subscription integration:
- **Monthly subscription**: $1.99/month for unlimited transcriptions
- **User-friendly**: Users provide their own OpenAI API keys (no per-transcript costs)
- **Secure**: All payments handled by Stripe

## 🔧 Setup Instructions

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete your account setup
3. Get your API keys from the Dashboard

### 2. Get Your Stripe Keys
In your Stripe Dashboard:
1. Go to **Developers** → **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_...`)
3. Copy your **Secret Key** (starts with `sk_test_...`)

### 3. Configure Environment Variables

#### For Local Development:
Create a `.env` file in your project root:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=your_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
```

**⚠️ IMPORTANT**: The keys are currently hardcoded in `app_secure.py` for convenience, but for production you should use environment variables.

#### For Railway Deployment:
1. Go to your Railway project dashboard
2. Click **Variables** tab
3. Add these environment variables:
   - `STRIPE_SECRET_KEY`: `your_secret_key_here`
   - `STRIPE_PUBLISHABLE_KEY`: `your_publishable_key_here`

### 4. Test Payment Flow
1. Start your app
2. Use test card numbers from [Stripe's docs](https://stripe.com/docs/testing#cards):
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC

## 💰 Revenue & Analytics

### Business Model Benefits:
- **Predictable Revenue**: $1.99/month per subscriber
- **Low Churn**: Users provide their own API keys (main cost)
- **Scalable**: No per-transcript costs to worry about
- **High Margin**: ~90%+ profit margin after Stripe fees

### Stripe Dashboard:
- View all transactions at [dashboard.stripe.com](https://dashboard.stripe.com)
- See revenue, successful payments, and failed attempts
- Download financial reports

### Usage Tracking:
The app automatically tracks:
- User subscription status and expiry dates
- Subscription start/end times
- Usage analytics (transcription count)
- Stored in `usage_tracking.json` (excluded from git)

## 🚀 Going Live (Production)

### 1. Switch to Live Keys
1. In Stripe Dashboard, toggle from **Test** to **Live** mode
2. Get your live API keys
3. Update environment variables with live keys:
   - `STRIPE_SECRET_KEY`: `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY`: `pk_live_...`

### 2. Enable Payment Methods
In Stripe Dashboard → **Settings** → **Payment Methods**:
- ✅ **Cards** (Visa, Mastercard, Amex)
- ✅ **Apple Pay** (automatic on supported devices)  
- ✅ **Google Pay** (automatic on supported devices)

## 💡 Pricing Strategy

### Current: $1.99/month subscription
This covers:
- Server hosting costs
- Payment processing fees (2.9% + 30¢)
- Platform maintenance and updates
- Customer support
- High profit margin (~$1.60+ per subscriber)

### Revenue Projections:
- **50 subscribers**: $99.50/month revenue
- **100 subscribers**: $199/month revenue  
- **500 subscribers**: $995/month revenue
- **1000 subscribers**: $1,990/month revenue

*Much more predictable than per-transcript pricing!*

## 📊 Expected Revenue

### Conservative Growth Estimates:
- **Month 1**: 10 subscribers → $19.90 revenue
- **Month 3**: 50 subscribers → $99.50 revenue  
- **Month 6**: 150 subscribers → $298.50 revenue
- **Month 12**: 500 subscribers → $995 revenue

*Assumes 20% monthly growth rate and ~5% churn*

### Advantages over per-transcript:
- ✅ Predictable monthly recurring revenue (MRR)
- ✅ Higher customer lifetime value (LTV)
- ✅ Users don't worry about costs per use
- ✅ Encourages regular usage
- ✅ Simpler billing and support

## 🛠️ Troubleshooting

### Common Issues:

**"Stripe not loading"**
- Check internet connection
- Verify publishable key is correct
- Check browser console for errors

**"Payment failed"**
- Test with different card numbers
- Check Stripe Dashboard for decline reasons
- Verify secret key is correct

**"Usage not tracking"**
- Check if `usage_tracking.json` has write permissions
- Verify user identifier is consistent

### Support:
- Stripe Documentation: [stripe.com/docs](https://stripe.com/docs)
- Test Cards: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- Your app logs: Check Railway/server logs for errors 