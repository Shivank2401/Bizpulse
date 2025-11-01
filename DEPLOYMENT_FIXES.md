# 🔧 Quick Deployment Fixes

## Issue: npm install dependency conflict (date-fns)

### Error:
```
npm error ERESOLVE unable to resolve dependency tree
npm error Could not resolve dependency:
npm error peer date-fns@"^2.28.0 || ^3.0.0" from react-day-picker@8.10.1
```

### Solution:

Run npm install with `--legacy-peer-deps` flag:

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
npm install --legacy-peer-deps
```

### Alternative Solution (if above doesn't work):

Clear npm cache and retry:

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

---

## Next Steps After Fixing Dependencies

### 1. Build Frontend

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
npm run build
```

This will create a `build/` folder.

### 2. Set Up Backend

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

Add to `.env`:
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=bizpulse
SECRET_KEY=your-super-secret-key-change-this
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000,https://beaconiq.thrivebrands.ai
```

### 3. Set Up AI FastAPI

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

Add to `.env`:
```env
PPLX_API_KEY1=your-perplexity-api-key
DATA_PATH=/home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code/yearly_data_1.xlsx
HOST=0.0.0.0
PORT=8005
CORS_ORIGINS=http://localhost:3000,https://beaconiq.thrivebrands.ai
```

---

## Common Issues & Fixes

### Issue: Python not found
```bash
# Check Python version
python3 --version

# If not installed
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

### Issue: Permission denied
```bash
# Fix ownership
sudo chown -R $USER:$USER /home/thrivebrands-beaconiq/htdocs/
```

### Issue: Port already in use
```bash
# Check what's using the port
sudo netstat -tlnp | grep 8000
sudo netstat -tlnp | grep 8005

# Kill the process
sudo kill -9 <PID>
```

### Issue: MongoDB connection failed
- Verify connection string in `.env`
- Whitelist your server IP in MongoDB Atlas dashboard
- Check network connectivity

### Issue: Module not found (Python)
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Testing Your Deployment

### 1. Test Backend API

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/backend
source venv/bin/activate
uvicorn server:api_router --host 0.0.0.0 --port 8000
```

In another terminal:
```bash
curl http://localhost:8000/api/data/source
```

### 2. Test AI FastAPI

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/python_code
source venv/bin/activate
uvicorn enhanced_fastapi_fixed:app --host 0.0.0.0 --port 8005
```

In another terminal:
```bash
curl http://localhost:8005/filter-options
```

### 3. Test Frontend Build

```bash
cd /home/thrivebrands-beaconiq/htdocs/beaconiq.thrivebrands.ai/Bizpulse/frontend
npm run build

# Serve the build folder
npx serve -s build -l 3000
```

---

## Production Setup

Once everything is tested, set up production services. See `DEPLOYMENT_GUIDE.md` for detailed instructions on:
- Systemd services
- Nginx reverse proxy
- SSL certificates
- Auto-restart configuration

---

**💡 Quick Tip:** Use `screen` or `tmux` to run multiple processes in the same SSH session:

```bash
# Install screen
sudo apt install screen -y

# Start a new screen session
screen -S bizpulse

# Run your command (e.g., uvicorn)
cd /path/to/project && source venv/bin/activate && uvicorn server:api_router --host 0.0.0.0 --port 8000

# Detach: Press Ctrl+A, then D
# Reattach: screen -r bizpulse
```

