# 🔒 SSL Certificate Fix - Quick Guide

## Problem

Your backend URL `https://beaconiqbackend.thrivebrands.ai` doesn't have a valid SSL certificate.

**Error:** `ERR_CERT_AUTHORITY_INVALID`

---

## Solutions

### Option 1: Use HTTP Temporarily (Quick Test)

**Update your frontend `.env` file:**

```env
REACT_APP_BACKEND_URL=http://beaconiqbackend.thrivebrands.ai
REACT_APP_INSIGHTS_URL=http://aibeaconiqbackend.thrivebrands.ai
```

**Rebuild frontend:**
```bash
cd frontend
npm run build
```

**⚠️ Note:** This works for testing, but HTTP is insecure for production.

---

### Option 2: Fix SSL in CloudPanel (Recommended)

1. **Go to CloudPanel Dashboard**
2. **Click on your backend site** (`beaconiqbackend.thrivebrands.ai`)
3. **Look for:** "SSL Settings" or "Security" or "HTTPS"
4. **Click:** "Generate SSL Certificate" or "Let's Encrypt"
5. **Follow prompts** to enable SSL

CloudPanel usually has a one-click SSL certificate setup using Let's Encrypt (free).

---

### Option 3: Manual SSL Setup (If CloudPanel doesn't work)

**Install Certbot:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

**Get certificate:**
```bash
sudo certbot --nginx -d beaconiqbackend.thrivebrands.ai
```

**Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Also Check: Backend .env File Format

Your `.env` file seems malformed. **Each variable should be on its own line:**

**Current (wrong):**
```
MONGO_URL=...DB_NAME=...CORS_ORIGINS=...
```

**Should be:**
```
MONGO_URL=mongodb+srv://sumitmishrasm004:Ecosoul%40123@cluster0.jvgspc2.mongodb.net/Bizpulse?retryWrites=true&w=majority

DB_NAME=thrivebrands_bi

CORS_ORIGINS=http://localhost:3000,https://beaconiq.thrivebrands.ai

OPENAI_API_KEY=your_openai_api_key_here

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=kineticadbms;AccountKey=JfMzO69p3Ip+Sz+YkXxp7sHxZw0O/JunSaS5qKnSSQnxk1lPhwiQwnGyyJif7sGB01l9amAdvU/t+ASthIK/ZQ==;EndpointSuffix=core.windows.net

AZURE_CONTAINER_NAME=thrive-worklytics

AZURE_BLOB_PATH=Biz-Pulse/yearly_data.csv
```

**Fix it:**
```bash
cd /path/to/backend
nano .env
# Edit and add newlines between each variable
# Ctrl+X, Y, Enter to save
```

---

## Quick Action Steps

1. **Check CloudPanel** for SSL settings first (easiest)
2. **Fix .env file** formatting (add newlines)
3. **Restart backend service** in CloudPanel
4. **Test** with HTTP first if SSL takes time

---

## Verify SSL is Working

```bash
# Check if certificate exists
curl -I https://beaconiqbackend.thrivebrands.ai/api/data/source

# Should return 200 or 401 (not certificate error)
```

---

**Priority: Enable SSL in CloudPanel first, then test!**

