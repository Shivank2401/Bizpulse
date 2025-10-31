# 🚀 FastAPI Deployment Guide

## Quick Deployment Options

### 1. **Vercel (Easiest - Recommended)**

#### Steps:
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd python_code
   vercel
   ```

4. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `PPLX_API_KEY1` = your_perplexity_api_key

5. **Update Frontend**:
   ```typescript
   // In client/app/services/deepIntelligenceAPI.ts
   const DEEP_INTELLIGENCE_API_URL = 'https://your-app-name.vercel.app';
   ```

### 2. **Railway (Great for Python)**

#### Steps:
1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Deploy**:
   ```bash
   cd python_code
   railway init
   railway up
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set PPLX_API_KEY1=your_perplexity_api_key
   ```

### 3. **Render (Free Tier)**

#### Steps:
1. **Connect GitHub Repository**
2. **Select "Web Service"**
3. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python production_server.py`
   - Environment: Python 3
4. **Set Environment Variables**:
   - `PPLX_API_KEY1` = your_perplexity_api_key

### 4. **Heroku (Classic)**

#### Steps:
1. **Install Heroku CLI**
2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   cd python_code
   heroku create your-app-name
   ```

4. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy FastAPI"
   git push heroku main
   ```

5. **Set Environment Variables**:
   ```bash
   heroku config:set PPLX_API_KEY1=your_perplexity_api_key
   ```

## 🔧 Frontend Configuration

After deploying your FastAPI backend, update your frontend:

### 1. **Update API URL**:
```typescript
// client/app/services/deepIntelligenceAPI.ts
const DEEP_INTELLIGENCE_API_URL = process.env.NEXT_PUBLIC_DEEP_INTELLIGENCE_API_URL || 'https://your-deployed-api.com';
```

### 2. **Environment Variables**:
Create `client/.env.local`:
```env
NEXT_PUBLIC_DEEP_INTELLIGENCE_API_URL=https://your-deployed-api.com
```

### 3. **Update CORS**:
In your deployed FastAPI, update the CORS origins:
```python
allow_origins=[
    "https://your-frontend-domain.com",
    "https://your-app.vercel.app",
    # Add your actual frontend domains
]
```

## 🧪 Testing Your Deployment

### 1. **Health Check**:
```bash
curl https://your-deployed-api.com/health
```

### 2. **Test Chat Endpoint**:
```bash
curl -X POST https://your-deployed-api.com/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the top performing channels?"}'
```

### 3. **API Documentation**:
Visit: `https://your-deployed-api.com/docs`

## 📊 Monitoring & Logs

### Vercel:
- Dashboard → Functions → View Logs

### Railway:
- Dashboard → Deployments → View Logs

### Render:
- Dashboard → Your Service → Logs

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit API keys to code
2. **CORS**: Only allow your frontend domains
3. **Rate Limiting**: Consider adding rate limiting for production
4. **HTTPS**: All platforms provide HTTPS by default

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Vercel | 100GB bandwidth | $20/month |
| Railway | $5 credit | $5/month |
| Render | 750 hours/month | $7/month |
| Heroku | No free tier | $7/month |

## 🎯 Recommended Approach

**For Quick Start**: Use **Vercel** - it's the easiest and most similar to your Node.js deployment experience.

**For Production**: Use **Railway** or **Render** - they're more robust for Python applications.

## 🚀 Next Steps

1. **Deploy your FastAPI** using one of the methods above
2. **Update your frontend** with the new API URL
3. **Test the integration** between frontend and backend
4. **Monitor performance** and logs
5. **Scale as needed**

Your FastAPI will be live and accessible from anywhere, just like your Node.js backend! 🎉

