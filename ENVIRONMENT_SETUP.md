# Environment Setup Guide

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=thrivebrands_bi

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# OpenAI API Key (for AI chat functionality)
OPENAI_API_KEY=your_openai_api_key_here

# Azure Storage Configuration (optional - for future use)
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=your_container_name
AZURE_BLOB_PATH=your_blob_path
```

## Required Setup Steps

### 1. MongoDB Setup
- **Local MongoDB**: Install MongoDB locally and ensure it's running on port 27017
- **MongoDB Atlas**: If using cloud MongoDB, update `MONGO_URL` with your connection string

### 2. OpenAI API Key (Optional)
- Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Replace `your_openai_api_key_here` with your actual API key
- **Note**: AI chat will show an error message if this is not configured

### 3. Azure Storage (Optional)
- These variables are for future use and can be left as placeholders
- No action required for basic functionality

## Quick Start Commands

```bash
# 1. Create the .env file
cd backend
# Copy the environment variables above into a new .env file

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate dummy data
python generate_dummy_data.py

# 4. Start the backend server
python server.py
```

## Default Login Credentials

- **Email**: `data.admin@thrivebrands.ai`
- **Password**: `123456User`

## Troubleshooting

- **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
- **CORS Error**: Make sure `CORS_ORIGINS` includes your frontend URL (http://localhost:3000)
- **AI Chat Not Working**: Check that `OPENAI_API_KEY` is set correctly
