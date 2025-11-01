# 🚀 Step-by-Step Deployment Instructions

## ✅ Current Status: Frontend Dependencies Installed

---

## 🎯 Next Steps

### 1️⃣ Build Frontend (CURRENT STEP)

**In your terminal, run:**
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
npm run build
```

**Expected output:**
- Build process starts
- Creates a `build/` folder with production files
- Takes 1-3 minutes

---

### 2️⃣ Set Up Backend API

**Open a NEW terminal window/tab and run:**
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

**Add to `.env` file:**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=bizpulse
SECRET_KEY=your-super-secret-key-change-this-in-production
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://beaconiq.thrivebrands.ai
ENVIRONMENT=production
DEBUG=False
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### 3️⃣ Set Up AI FastAPI

**In another terminal:**
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

**Add to `.env` file:**
```env
PPLX_API_KEY1=your-perplexity-api-key
DATA_PATH=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code/yearly_data_1.xlsx
HOST=0.0.0.0
PORT=8005
CORS_ORIGINS=http://localhost:3000,https://beaconiq.thrivebrands.ai
ENVIRONMENT=production
DEBUG=False
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

---

### 4️⃣ Test Services

#### Test Backend (Terminal 1):
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend
source venv/bin/activate
uvicorn server:api_router --host 0.0.0.0 --port 8000
```

**Keep this running!**

#### Test AI FastAPI (Terminal 2):
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code
source venv/bin/activate
uvicorn enhanced_fastapi_fixed:app --host 0.0.0.0 --port 8005
```

**Keep this running!**

#### Test Frontend (Terminal 3):
```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
npx serve -s build -l 3000
```

**Open browser:** `http://your-server-ip:3000`

---

### 5️⃣ Production Setup (After Testing Works)

**Set up auto-restart services:**

#### Create Backend Service:
```bash
sudo nano /etc/systemd/system/bizpulse-backend.service
```

**Paste this:**
```ini
[Unit]
Description=BizPulse Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend
Environment="PATH=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend/venv/bin"
ExecStart=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend/venv/bin/uvicorn server:api_router --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-backend
sudo systemctl start bizpulse-backend
sudo systemctl status bizpulse-backend
```

#### Create AI FastAPI Service:
```bash
sudo nano /etc/systemd/system/bizpulse-ai.service
```

**Paste this:**
```ini
[Unit]
Description=BizPulse AI FastAPI
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code
Environment="PATH=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code/venv/bin"
ExecStart=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code/venv/bin/uvicorn enhanced_fastapi_fixed:app --host 0.0.0.0 --port 8005
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-ai
sudo systemctl start bizpulse-ai
sudo systemctl status bizpulse-ai
```

---

### 6️⃣ Configure Nginx (If Needed)

**Check if Nginx is installed:**
```bash
which nginx
```

**If not installed:**
```bash
sudo apt update
sudo apt install nginx -y
```

**Create config:**
```bash
sudo nano /etc/nginx/sites-available/bizpulse
```

**Add this (adjust domains):**
```nginx
server {
    listen 80;
    server_name beaconiq.thrivebrands.ai;

    # Frontend
    location / {
        root /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # AI FastAPI
    location /insights/ {
        proxy_pass http://127.0.0.1:8005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable:**
```bash
sudo ln -s /etc/nginx/sites-available/bizpulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ Checklist

- [ ] Frontend built successfully
- [ ] Backend environment created
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] AI FastAPI environment created
- [ ] AI FastAPI dependencies installed
- [ ] AI FastAPI .env configured
- [ ] All services tested manually
- [ ] Systemd services created
- [ ] Services auto-starting on boot
- [ ] Nginx configured (optional)
- [ ] SSL certificates installed (optional)

---

## 🔍 Useful Commands

### View Logs
```bash
# Backend logs
sudo journalctl -u bizpulse-backend -f

# AI FastAPI logs
sudo journalctl -u bizpulse-ai -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart bizpulse-backend
sudo systemctl restart bizpulse-ai
sudo systemctl restart nginx
```

### Check Status
```bash
sudo systemctl status bizpulse-backend
sudo systemctl status bizpulse-ai
sudo systemctl status nginx
```

### Test Endpoints
```bash
# Backend
curl http://localhost:8000/api/data/source

# AI FastAPI
curl http://localhost:8005/filter-options
```

---

## 🆘 Need Help?

- Check logs for errors
- Verify .env files are correct
- Test each service individually
- Check ports aren't blocked by firewall
- Verify MongoDB Atlas IP whitelist

