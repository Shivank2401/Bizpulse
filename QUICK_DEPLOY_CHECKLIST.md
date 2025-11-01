# ⚡ Quick Deployment Checklist

## 🎯 Pre-Flight Checklist

### Backend API (Port 8000)
- [ ] MongoDB Atlas account created
- [ ] MongoDB connection string ready
- [ ] Azure Blob Storage credentials (if using)
- [ ] Backend code uploaded to Hostinger
- [ ] Virtual environment created
- [ ] `requirements.txt` installed
- [ ] `.env` file configured
- [ ] Systemd service created
- [ ] Service started and enabled
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed

### AI FastAPI (Port 8005)
- [ ] Perplexity API key obtained
- [ ] AI FastAPI code uploaded to Hostinger
- [ ] `yearly_data_1.xlsx` uploaded
- [ ] Virtual environment created
- [ ] `requirements.txt` installed
- [ ] `.env` file configured
- [ ] Systemd service created
- [ ] Service started and enabled
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed

### Frontend (React)
- [ ] Frontend code in GitHub
- [ ] Vercel/Netlify account created
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL enabled

---

## 📝 Environment Variables Templates

### Backend `.env` Template
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=bizpulse
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AZURE_CONNECTION_STRING=your-azure-connection-string
AZURE_CONTAINER_NAME=your-container
AZURE_BLOB_PATH=yearly_data.csv
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
ENVIRONMENT=production
DEBUG=False
```

### AI FastAPI `.env` Template
```env
PPLX_API_KEY1=your-perplexity-api-key
DATA_PATH=/home/your-username/bizpulse-ai/yearly_data_1.xlsx
HOST=0.0.0.0
PORT=8005
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
ENVIRONMENT=production
DEBUG=False
LOG_FILE=/home/your-username/bizpulse-ai/deep_intelligence_errors.log
```

### Frontend `.env.production` Template
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_INSIGHTS_URL=https://ai.yourdomain.com
```

---

## 🚀 Deployment Commands (Copy-Paste Ready)

### On Hostinger Server (Backend)
```bash
# Navigate to backend
cd /home/your-username/bizpulse-backend/

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/bizpulse-backend.service
# (Paste service content from guide)

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-backend
sudo systemctl start bizpulse-backend
sudo systemctl status bizpulse-backend

# Check logs
sudo journalctl -u bizpulse-backend -f
```

### On Hostinger Server (AI FastAPI)
```bash
# Navigate to AI directory
cd /home/your-username/bizpulse-ai/

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/bizpulse-ai.service
# (Paste service content from guide)

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable bizpulse-ai
sudo systemctl start bizpulse-ai
sudo systemctl status bizpulse-ai

# Check logs
sudo journalctl -u bizpulse-ai -f
```

### On Hostinger Server (Nginx)
```bash
# Install Nginx
sudo apt install nginx -y

# Create configs
sudo nano /etc/nginx/sites-available/bizpulse-backend
sudo nano /etc/nginx/sites-available/bizpulse-ai

# Enable sites
sudo ln -s /etc/nginx/sites-available/bizpulse-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bizpulse-ai /etc/nginx/sites-enabled/

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d ai.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## ✅ Testing Commands

### Test Backend API
```bash
curl http://api.yourdomain.com/api/data/source
curl http://localhost:8000/api/data/source
```

### Test AI FastAPI
```bash
curl http://ai.yourdomain.com/filter-options
curl http://localhost:8005/filter-options
```

### Check Services Running
```bash
sudo systemctl status bizpulse-backend
sudo systemctl status bizpulse-ai
sudo systemctl status nginx
```

### Check Ports
```bash
sudo netstat -tlnp | grep 8000
sudo netstat -tlnp | grep 8005
```

---

## 🐛 Common Issues & Fixes

### "Port already in use"
```bash
# Find process using port
sudo lsof -i :8000
sudo lsof -i :8005

# Kill process
sudo kill -9 <PID>
```

### "Permission denied"
```bash
# Fix ownership
sudo chown -R your-username:your-username /home/your-username/bizpulse-backend
sudo chown -R your-username:your-username /home/your-username/bizpulse-ai
```

### "Module not found"
```bash
# Reinstall dependencies
source venv/bin/activate
pip install -r requirements.txt
```

### "Can't connect to MongoDB"
```bash
# Check connection string in .env
# Whitelist your server IP in MongoDB Atlas
# Test connection
ping cluster.mongodb.net
```

### "Service failed to start"
```bash
# Check logs
sudo journalctl -u bizpulse-backend --no-pager | tail -50
sudo journalctl -u bizpulse-ai --no-pager | tail -50

# Check .env file exists and has correct values
cat .env
```

---

## 🔄 Update/Deploy New Code

### Backend Update
```bash
cd /home/your-username/bizpulse-backend/
git pull origin main  # or upload new files
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart bizpulse-backend
```

### AI FastAPI Update
```bash
cd /home/your-username/bizpulse-ai/
git pull origin main  # or upload new files
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart bizpulse-ai
```

### Frontend Update (Vercel/Netlify)
```bash
# Just push to GitHub, auto-deploys
git add .
git commit -m "Update frontend"
git push origin main
```

---

## 📊 Monitoring

### View Real-Time Logs
```bash
# Backend
sudo journalctl -u bizpulse-backend -f

# AI FastAPI
sudo journalctl -u bizpulse-ai -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Service Health
```bash
# Backend
curl http://localhost:8000/api/data/source

# AI FastAPI
curl http://localhost:8005/filter-options
```

---

## 🎉 Success Indicators

- ✅ Backend accessible at `https://api.yourdomain.com`
- ✅ AI FastAPI accessible at `https://ai.yourdomain.com`
- ✅ Frontend accessible at `https://yourdomain.com`
- ✅ Login works
- ✅ Dashboard loads data
- ✅ AI chat responds
- ✅ All services restart after reboot
- ✅ SSL working (green padlock)
- ✅ No errors in logs

---

**📞 Need Help?**
- Check DEPLOYMENT_GUIDE.md for detailed instructions
- Review logs with `journalctl`
- Test each component individually
- Verify all environment variables

