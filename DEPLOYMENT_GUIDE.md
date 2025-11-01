# 🚀 Complete Deployment Guide for BizPulse

## 📋 Architecture Overview

Your application has 3 separate components:

1. **Frontend** (React) → Vercel/Netlify (recommended) OR Hostinger
2. **Backend API** (FastAPI) → Hostinger VPS/Shared Hosting → Port 8000
3. **AI FastAPI** (Perplexity) → Hostinger VPS/Shared Hosting → Port 8005

---

## 🔧 Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] MongoDB Atlas account (free tier available)
- [ ] Hostinger VPS or Shared Hosting with Python 3.9+
- [ ] Perplexity API key
- [ ] Azure Blob Storage credentials (if using Azure)
- [ ] Domain names (optional but recommended)

---

## 📦 STEP 1: Backend API Deployment (Port 8000)

### Location: `backend/` folder

### 1.1 Prepare Hostinger VPS/Shared Hosting

**SSH into your Hostinger server:**

```bash
ssh your-username@your-server-ip
```

**Install Python and dependencies:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# Install MongoDB (if using local MongoDB, otherwise use Atlas)
sudo apt install mongodb -y
```

### 1.2 Upload Backend Code

**Upload backend folder to server:**

```bash
# On your local machine
cd backend/
scp -r * your-username@your-server-ip:/home/your-username/bizpulse-backend/
```

**OR use FileZilla/WinSCP to upload files via FTP**

### 1.3 Set Up Backend Environment

**On Hostinger server:**

```bash
# Navigate to backend directory
cd /home/your-username/bizpulse-backend/

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 1.4 Configure Backend Environment Variables

**Create `.env` file in backend folder:**

```bash
nano .env
```

**Add these variables:**

```env
# MongoDB Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=bizpulse

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Azure Blob Storage (Optional)
AZURE_CONNECTION_STRING=your-azure-connection-string
AZURE_CONTAINER_NAME=your-container-name
AZURE_BLOB_PATH=yearly_data.csv

# Server Configuration
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Environment
ENVIRONMENT=production
DEBUG=False
```

### 1.5 Create Systemd Service for Backend

**Create service file:**

```bash
sudo nano /etc/systemd/system/bizpulse-backend.service
```

**Add this content:**

```ini
[Unit]
Description=BizPulse Backend API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/bizpulse-backend
Environment="PATH=/home/your-username/bizpulse-backend/venv/bin"
ExecStart=/home/your-username/bizpulse-backend/venv/bin/uvicorn server:api_router --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-backend
sudo systemctl start bizpulse-backend
sudo systemctl status bizpulse-backend
```

### 1.6 Set Up Nginx Reverse Proxy (Optional but Recommended)

**Install Nginx:**

```bash
sudo apt install nginx -y
```

**Create Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/bizpulse-backend
```

**Add this content:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🤖 STEP 2: AI FastAPI Deployment (Port 8005)

### Location: `python_code/` folder

### 2.1 Upload AI FastAPI Code

**Upload python_code folder to server:**

```bash
# On your local machine
cd python_code/
scp -r * your-username@your-server-ip:/home/your-username/bizpulse-ai/
```

### 2.2 Set Up AI FastAPI Environment

**On Hostinger server:**

```bash
# Navigate to AI directory
cd /home/your-username/bizpulse-ai/

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.3 Configure AI FastAPI Environment Variables

**Create `.env` file in python_code folder:**

```bash
nano .env
```

**Add these variables:**

```env
# Perplexity API Key
PPLX_API_KEY1=your-perplexity-api-key

# Data File Path
DATA_PATH=/home/your-username/bizpulse-ai/yearly_data_1.xlsx

# Server Configuration
HOST=0.0.0.0
PORT=8005
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Environment
ENVIRONMENT=production
DEBUG=False
LOG_FILE=/home/your-username/bizpulse-ai/deep_intelligence_errors.log
```

### 2.4 Upload Data File

**Upload the Excel file:**

```bash
# On your local machine
scp yearly_data_1.xlsx your-username@your-server-ip:/home/your-username/bizpulse-ai/
```

### 2.5 Create Systemd Service for AI FastAPI

**Create service file:**

```bash
sudo nano /etc/systemd/system/bizpulse-ai.service
```

**Add this content:**

```ini
[Unit]
Description=BizPulse AI FastAPI
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/bizpulse-ai
Environment="PATH=/home/your-username/bizpulse-ai/venv/bin"
ExecStart=/home/your-username/bizpulse-ai/venv/bin/uvicorn enhanced_fastapi_fixed:app --host 0.0.0.0 --port 8005
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-ai
sudo systemctl start bizpulse-ai
sudo systemctl status bizpulse-ai
```

### 2.6 Set Up Nginx for AI FastAPI

**Create Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/bizpulse-ai
```

**Add this content:**

```nginx
server {
    listen 80;
    server_name ai.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:8005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 💻 STEP 3: Frontend Deployment

### Location: `frontend/` folder

### 3.1 Option A: Deploy to Vercel (Recommended)

**Why Vercel?**
- Free tier available
- Auto-deployments from GitHub
- Built-in SSL
- CDN for fast loading

**Steps:**

1. **Push code to GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/bizpulse.git
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure:
     - **Framework Preset:** Create React App
     - **Root Directory:** `frontend`
     - **Environment Variables:**
       ```
       REACT_APP_BACKEND_URL=https://api.yourdomain.com
       REACT_APP_INSIGHTS_URL=https://ai.yourdomain.com
       ```
   - Deploy

### 3.2 Option B: Deploy to Netlify

**Steps:**

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to https://netlify.com
   - Import repository
   - Configure:
     - **Base directory:** `frontend`
     - **Build command:** `npm run build`
     - **Publish directory:** `build`
   - Add environment variables:
     ```
     REACT_APP_BACKEND_URL=https://api.yourdomain.com
     REACT_APP_INSIGHTS_URL=https://ai.yourdomain.com
     ```

### 3.3 Option C: Deploy to Hostinger Static Hosting

**Build frontend locally:**

```bash
cd frontend/
npm install
npm run build
```

**Upload build folder:**

```bash
# On your local machine
scp -r build/* your-username@your-server-ip:/home/your-username/public_html/
```

**Configure Nginx for frontend:**

```bash
sudo nano /etc/nginx/sites-available/bizpulse-frontend
```

**Add this content:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Your main domain

    root /home/your-username/public_html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.4 Update Frontend Environment Variables

**Before building, create `.env.production` in frontend folder:**

```bash
cd frontend/
nano .env.production
```

**Add this content:**

```env
REACT_APP_BACKEND_URL=http://api.yourdomain.com
REACT_APP_INSIGHTS_URL=http://ai.yourdomain.com
```

**Rebuild:**

```bash
npm run build
```

---

## 🔒 STEP 4: SSL/HTTPS Setup (Important!)

**Install Certbot:**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Get SSL certificates:**

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d ai.yourdomain.com
```

**Auto-renewal:**

```bash
sudo certbot renew --dry-run
```

---

## 🧪 STEP 5: Testing & Verification

### 5.1 Test Backend API

```bash
# Health check
curl http://api.yourdomain.com/api/data/source

# Should return JSON with data source info
```

### 5.2 Test AI FastAPI

```bash
# Health check
curl http://ai.yourdomain.com/filter-options

# Should return filter options
```

### 5.3 Test Frontend

- Open `https://yourdomain.com` in browser
- Try logging in
- Test dashboard features
- Verify AI chat works

---

## 🔍 STEP 6: Monitoring & Logs

### View Backend Logs

```bash
sudo journalctl -u bizpulse-backend -f
```

### View AI FastAPI Logs

```bash
sudo journalctl -u bizpulse-ai -f
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
sudo systemctl restart bizpulse-backend
sudo systemctl restart bizpulse-ai
sudo systemctl restart nginx
```

---

## 🚨 Troubleshooting

### Issue: Backend not starting

**Check:**
```bash
sudo systemctl status bizpulse-backend
# Look for errors in output

# Check if port 8000 is in use
sudo netstat -tlnp | grep 8000

# Check logs
sudo journalctl -u bizpulse-backend --no-pager
```

**Common fixes:**
- Verify `.env` file exists and has correct values
- Check MongoDB connection string
- Ensure virtual environment is activated
- Check file permissions

### Issue: AI FastAPI not starting

**Check:**
```bash
sudo systemctl status bizpulse-ai
sudo journalctl -u bizpulse-ai --no-pager
```

**Common fixes:**
- Verify Perplexity API key is correct
- Check if `yearly_data_1.xlsx` exists at correct path
- Ensure Python dependencies are installed
- Check `.env` configuration

### Issue: Frontend not connecting to APIs

**Check:**
- Verify environment variables are set in frontend
- Check CORS settings in backend/AI FastAPI
- Test API endpoints directly with curl/Postman
- Check browser console for errors

### Issue: MongoDB connection failed

**Check:**
- Verify connection string in `.env`
- Whitelist your server IP in MongoDB Atlas
- Check network connectivity: `ping cluster.mongodb.net`
- Verify database name is correct

---

## 📊 Cost Estimation

### Free Tier (Development/Small Projects)
- **Vercel:** Free (frontend)
- **MongoDB Atlas:** Free (512MB storage)
- **Hostinger VPS:** ~$5-10/month
- **Domain:** ~$10/year
- **Total:** ~$70-130/year

### Production (Recommended)
- **Vercel Pro:** $20/month
- **MongoDB Atlas M10:** ~$57/month
- **Hostinger VPS:** ~$15-30/month
- **Domain:** ~$15/year
- **Perplexity API:** Pay-per-use
- **Total:** ~$1000-1500/year

---

## 🎉 Success Checklist

- [ ] Backend API accessible at `https://api.yourdomain.com`
- [ ] AI FastAPI accessible at `https://ai.yourdomain.com`
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] Login functionality works
- [ ] Dashboard loads data correctly
- [ ] AI chat responds with insights
- [ ] SSL certificates installed
- [ ] Services restart automatically on server reboot
- [ ] Logs are being written and accessible

---

## 📞 Support

**If you encounter issues:**

1. Check logs for errors
2. Verify all environment variables are set
3. Test each component independently
4. Check network connectivity
5. Verify MongoDB Atlas IP whitelist

---

## 🔄 Updates & Maintenance

### Update Backend

```bash
cd /home/your-username/bizpulse-backend/
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart bizpulse-backend
```

### Update AI FastAPI

```bash
cd /home/your-username/bizpulse-ai/
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart bizpulse-ai
```

### Update Frontend

**If using Vercel/Netlify:** Automatic on git push

**If using Hostinger:** Rebuild and upload

```bash
cd frontend/
npm run build
scp -r build/* your-server-ip:/home/your-username/public_html/
```

---

**🎉 Congratulations! Your BizPulse application is now deployed!**

