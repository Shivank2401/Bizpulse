# 🔧 Nginx Configuration Files

Copy these configurations to your Hostinger server.

---

## 1. Backend API Nginx Config

**File:** `/etc/nginx/sites-available/bizpulse-backend`

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

**Enable it:**
```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 2. AI FastAPI Nginx Config

**File:** `/etc/nginx/sites-available/bizpulse-ai`

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

**Enable it:**
```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. Frontend Nginx Config (if hosting on Hostinger)

**File:** `/etc/nginx/sites-available/bizpulse-frontend`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain

    root /home/your-username/public_html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable it:**
```bash
sudo ln -s /etc/nginx/sites-available/bizpulse-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. SSL/HTTPS Setup

**After setting up the above configs, add SSL:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d ai.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configs to use HTTPS.

---

## 🔍 Nginx Troubleshooting

### Test Config
```bash
sudo nginx -t
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check Status
```bash
sudo systemctl status nginx
```

### View Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check if Nginx is running
```bash
sudo systemctl is-active nginx
```

---

## ⚠️ Important Notes

1. **Replace `yourdomain.com`** with your actual domain
2. **Replace `your-username`** with your Hostinger username
3. **Update paths** to match your actual file locations
4. **Test config** with `sudo nginx -t` before restarting
5. **Keep backup** of working configs before making changes

