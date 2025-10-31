# 🐛 Deep Intelligence API - Debug Guide

## 🚨 **Problem**: Frontend Deep Intelligence button not responding

## 🔍 **Step-by-Step Debugging Process**

### **Step 1: Test Your Setup (No API Calls)**
```bash
cd python_code
python test_without_api.py
```
This will test:
- ✅ Data file loading
- ✅ Query parsing
- ✅ API endpoints
- ✅ CORS configuration
- ✅ Server connectivity

### **Step 2: Test with Fixed Server**
```bash
# Stop your current server (Ctrl+C)
# Then run the fixed version:
python start_fixed_server.py
```

### **Step 3: Test API Endpoints Manually**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test CORS preflight
curl -X OPTIONS http://localhost:8000/chat \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"query": "test query", "conversation_history": []}'
```

### **Step 4: Test Frontend Connection**
```bash
python test_debug.py
```

## 🔧 **Common Issues & Fixes**

### **Issue 1: CORS Error (400 Bad Request on OPTIONS)**
**Symptoms**: Browser console shows CORS error, OPTIONS request fails
**Fix**: Use the fixed server version
```bash
python enhanced_fastapi_fixed.py
```

### **Issue 2: Data File Not Found**
**Symptoms**: Server starts but can't load data
**Fix**: Update DATA_PATH in .env file
```bash
# Edit .env file
DATA_PATH=C:\path\to\your\yearly_data.xlsx
```

### **Issue 3: API Key Not Working**
**Symptoms**: Server responds but API calls fail
**Fix**: Check your Perplexity API key
```bash
# Edit .env file
PPLX_API_KEY1=pplx-your-actual-api-key-here
```

### **Issue 4: Frontend Can't Connect**
**Symptoms**: Frontend shows loading but no response
**Fix**: Check browser console and network tab
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Look for CORS errors or 404/500 errors

## 🛠️ **Quick Fixes**

### **Fix 1: Restart Everything**
```bash
# Stop all servers
# Then start in this order:
# 1. Backend
python enhanced_fastapi_fixed.py

# 2. Frontend (in another terminal)
cd client
npm run dev
```

### **Fix 2: Clear Browser Cache**
1. Open browser developer tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### **Fix 3: Check Ports**
```bash
# Check if ports are in use
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill processes if needed
taskkill /PID <process_id> /F
```

## 📊 **Debugging Checklist**

- [ ] ✅ .env file exists and has correct values
- [ ] ✅ Data file exists and is accessible
- [ ] ✅ FastAPI server is running on port 8000
- [ ] ✅ Frontend is running on port 3000
- [ ] ✅ CORS is properly configured
- [ ] ✅ API endpoints are responding
- [ ] ✅ Browser console shows no errors
- [ ] ✅ Network requests are successful

## 🧪 **Test Files Available**

1. **`test_debug.py`** - Comprehensive test suite
2. **`test_without_api.py`** - Test without API calls
3. **`enhanced_fastapi_fixed.py`** - Fixed server with CORS
4. **`start_fixed_server.py`** - Easy server startup

## 🚀 **Quick Start (Recommended)**

```bash
# 1. Test your setup
python test_without_api.py

# 2. If tests pass, start fixed server
python start_fixed_server.py

# 3. In another terminal, start frontend
cd client
npm run dev

# 4. Test in browser
# Open http://localhost:3000
# Click Deep Intelligence button
# Try asking a question
```

## 📞 **If Still Not Working**

1. **Check the logs**:
   - Server logs in terminal
   - Browser console errors
   - Network tab in browser

2. **Test each component separately**:
   - Test API with curl/Postman
   - Test frontend with mock data
   - Test data loading separately

3. **Common error messages**:
   - `CORS error` → Use fixed server version
   - `Data file not found` → Check DATA_PATH in .env
   - `API key invalid` → Check PPLX_API_KEY1 in .env
   - `Connection refused` → Make sure server is running

## 🎯 **Expected Behavior**

When working correctly:
1. ✅ Server starts without errors
2. ✅ Health endpoint returns `{"status": "healthy"}`
3. ✅ CORS preflight returns 200 OK
4. ✅ Chat endpoint accepts POST requests
5. ✅ Frontend can send requests and receive responses
6. ✅ Deep Intelligence modal opens and responds to queries

## 💡 **Pro Tips**

- **Always test without API first** to avoid wasting credits
- **Check browser console** for JavaScript errors
- **Use the fixed server version** for CORS issues
- **Test with simple queries first** before complex ones
- **Keep logs open** to see what's happening

---

**Remember**: The test files are designed to help you debug without wasting your Perplexity API credits! 🎉
