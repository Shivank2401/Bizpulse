# 🚀 CloudPanel Deployment Guide

## 🎯 Strategy: Use CloudPanel's Built-in Site Creation

CloudPanel makes it easy to deploy separate services. Create **3 sites**:

---

## 📦 Site Architecture

### Site 1: Frontend (Node.js) ✅ ALREADY CREATED
- **Type:** Node.js Site
- **Domain:** `beaconiq.thrivebrands.ai`
- **Purpose:** Serves React build files
- **Status:** Already created in CloudPanel

### Site 2: Backend API (Python) - CREATE THIS
- **Type:** Python Site
- **Subdomain:** `api.beaconiq.thrivebrands.ai` (or any subdomain you prefer)
- **Purpose:** Runs Backend FastAPI (port 8000)

### Site 3: AI FastAPI (Python) - CREATE THIS
- **Type:** Python Site
- **Subdomain:** `ai.beaconiq.thrivebrands.ai` (or any subdomain you prefer)
- **Purpose:** Runs AI FastAPI (port 8005)

---

## 🔧 Step-by-Step Deployment

### STEP 1: Deploy Frontend (Already Done)

**Current:** Node.js site created

**Next:**
1. Upload `build/` folder to the site's root directory
2. Or configure the build process in CloudPanel

---

### STEP 2: Create Backend API Site (Python)

1. **In CloudPanel, click:** "Create a Python Site"

2. **Configure:**
   - **Domain:** `api.beaconiq.thrivebrands.ai`
   - **Python Version:** 3.9 or higher
   - **Choose:** Existing Application
   - **Application Directory:** `/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend`

3. **Set up Environment:**
   ```bash
   # CloudPanel will create a virtual environment
   # Navigate to backend directory
   cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend
   
   # Activate virtual environment (CloudPanel creates it)
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```bash
   nano .env
   ```
   
   **Add:**
   ```env
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DB_NAME=bizpulse
   SECRET_KEY=your-super-secret-key-change-this
   HOST=0.0.0.0
   PORT=8000
   CORS_ORIGINS=https://beaconiq.thrivebrands.ai,https://api.beaconiq.thrivebrands.ai,https://ai.beaconiq.thrivebrands.ai
   ENVIRONMENT=production
   DEBUG=False
   ```

5. **Configure WSGI/Application Entry Point:**
   - In CloudPanel Python site settings
   - **App file:** `server.py`
   - **App variable:** `api_router` or `app`
   - **Working Directory:** The backend folder path

---

### STEP 3: Create AI FastAPI Site (Python)

1. **In CloudPanel, click:** "Create a Python Site"

2. **Configure:**
   - **Domain:** `ai.beaconiq.thrivebrands.ai`
   - **Python Version:** 3.9 or higher
   - **Choose:** Existing Application
   - **Application Directory:** `/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code`

3. **Set up Environment:**
   ```bash
   # Navigate to python_code directory
   cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code
   
   # Activate virtual environment
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```bash
   nano .env
   ```
   
   **Add:**
   ```env
   PPLX_API_KEY1=your-perplexity-api-key
   DATA_PATH=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code/yearly_data_1.xlsx
   HOST=0.0.0.0
   PORT=8005
   CORS_ORIGINS=https://beaconiq.thrivebrands.ai,https://api.beaconiq.thrivebrands.ai,https://ai.beaconiq.thrivebrands.ai
   ENVIRONMENT=production
   DEBUG=False
   ```

5. **Configure Application:**
   - **App file:** `enhanced_fastapi_fixed.py`
   - **App variable:** `app`
   - **Working Directory:** The python_code folder path

---

## 🌐 Domain Configuration

### Create Subdomains in CloudPanel:

1. **Go to CloudPanel:** Domains → DNS Settings
2. **Create subdomains:**
   - `api.beaconiq.thrivebrands.ai` → Points to Backend Python site
   - `ai.beaconiq.thrivebrands.ai` → Points to AI Python site

**OR**

### Use CloudPanel's Auto-Subdomain Feature:
- CloudPanel can automatically create subdomains for each site

---

## 🔧 CloudPanel Python Configuration

### For Each Python Site:

1. **Access Site Settings:**
   - Go to Sites → Click on your Python site
   - Click "Settings" or "Configuration"

2. **Configure:**
   - **Runtime:** Python 3.9+ (recommended 3.10 or 3.11)
   - **Application Type:** FastAPI/WSGI
   - **Working Directory:** Full path to your backend/python_code folder
   - **App Entry Point:** 
     - Backend: `server:api_router` or `server:app`
     - AI FastAPI: `enhanced_fastapi_fixed:app`
   - **Port:** Leave auto or set manually
   - **Environment Variables:** Add from `.env` file

3. **Environment Variables in CloudPanel:**
   - Some CloudPanel versions allow adding env vars in the UI
   - Look for "Environment Variables" section
   - Add each variable from your `.env` file

---

## ✅ Verification & Testing

### Test Each Service:

```bash
# Test Backend
curl https://api.beaconiq.thrivebrands.ai/api/data/source

# Test AI FastAPI
curl https://ai.beaconiq.thrivebrands.ai/filter-options

# Test Frontend
# Open browser: https://beaconiq.thrivebrands.ai
```

---

## 🔄 Alternative: Single Site with Reverse Proxy

If you prefer **one site** for everything:

1. **Create:** "Reverse Proxy" site in CloudPanel
2. **Configure:**
   - Domain: `beaconiq.thrivebrands.ai`
   - Routes:
     - `/` → Frontend (Node.js)
     - `/api/` → Backend (Python on port 8000)
     - `/insights/` → AI FastAPI (Python on port 8005)

**This is more complex but possible.**

---

## 🎯 Recommended Approach

**✅ Best Option: Use CloudPanel's Python Sites**

- **Pros:**
  - Each service gets its own subdomain
  - Easy to manage in CloudPanel
  - Automatic process management
  - Built-in SSL certificates
  - Easy logging and monitoring
  - Can scale independently

- **Why separate sites:**
  - CloudPanel manages each Python app automatically
  - Easy to restart/update individual services
  - Better isolation and security
  - Clearer separation of concerns

---

## 📋 Checklist

- [ ] Frontend site created (Node.js) ✅
- [ ] Frontend built and deployed
- [ ] Backend site created (Python)
- [ ] Backend environment configured
- [ ] Backend dependencies installed
- [ ] Backend .env created
- [ ] AI FastAPI site created (Python)
- [ ] AI FastAPI environment configured
- [ ] AI FastAPI dependencies installed
- [ ] AI FastAPI .env created
- [ ] DNS configured for subdomains
- [ ] SSL certificates active
- [ ] All services tested

---

## 🔍 CloudPanel Specific Commands

### View Logs:
```bash
# CloudPanel usually provides log viewing in UI
# Or check application logs:
cd /path/to/site/logs
tail -f app.log
```

### Restart Service:
- Use CloudPanel UI: Sites → Your Site → Restart
- Or via terminal: `systemctl restart sitename`

### Update Code:
```bash
# Pull latest code
cd /path/to/site
git pull origin main

# Restart site in CloudPanel UI
```

---

## 🆘 Troubleshooting

### Site won't start:
- Check application entry point is correct
- Verify port isn't already in use
- Check logs in CloudPanel UI
- Verify .env file exists

### Dependencies issues:
- Make sure virtual environment is activated
- Run: `pip install -r requirements.txt`
- Check Python version compatibility

### Connection refused:
- Check CORS settings in .env
- Verify subdomains resolve correctly
- Check firewall settings in CloudPanel

---

## 💡 Tips

1. **Use CloudPanel's UI as much as possible** - It's designed to make this easy
2. **Keep .env files secure** - Don't commit them to git
3. **Use subdomains** - Cleaner separation than paths
4. **Test each site individually** - Before connecting frontend
5. **Check CloudPanel docs** - For Python-specific setup

---

**🎉 You're ready to deploy!**

Start with creating the two Python sites in CloudPanel, then follow this guide for each.

