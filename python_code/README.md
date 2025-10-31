# Deep Intelligence FastAPI Backend

This is the FastAPI backend for the Deep Intelligence feature that provides AI-powered business insights.

## Features

- **AI-Powered Chat**: Uses Perplexity AI API for intelligent business analysis
- **Data Analysis**: Processes financial data (gSales, fGP, Cases, cost drivers)
- **Interactive Queries**: Supports natural language queries about business performance
- **Filtering**: Advanced filtering capabilities for data analysis
- **CORS Support**: Configured for React frontend integration

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**CRITICAL**: Create a `.env` file in the python_code directory with your actual credentials:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your actual values
```

Required environment variables:
```env
PPLX_API_KEY1=your_perplexity_api_key_here  # Get from https://www.perplexity.ai/settings/api
DATA_PATH=/path/to/your/data/file.xlsx     # Optional: defaults to yearly_data_1.xlsx
```

**Security Note**: 
- **NEVER commit your `.env` file** to version control
- Use different API keys for development and production
- Rotate your keys regularly

### 3. Start the Server

```bash
python start_deep_intelligence.py
```

Or directly:

```bash
# For the main AI API (port 8005):
uvicorn enhanced_fastapi_fixed:app --host 0.0.0.0 --port 8005 --reload
```

The server will start at `http://localhost:8005` (or configured port)

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Chat Interface
- **POST** `/chat` - Send queries to the AI assistant
- **GET** `/filter-options` - Get available filter options
- **GET** `/data-summary` - Get data summary statistics

## Example Usage

### Chat Request
```json
POST /chat
{
  "query": "Which channel had the highest gSales in 2024?",
  "conversation_history": [],
  "filters": {
    "year": ["2024"],
    "month": [],
    "business": [],
    "channel": [],
    "brand": [],
    "category": [],
    "customer": []
  }
}
```

### Response
```json
{
  "response": "After digging into the data, the Grocery channel had the highest gSales in 2024 with €2,450,000...",
  "timestamp": "01:03 PM IST on October 18, 2025",
  "context": "Data for 'Which channel had the highest gSales in 2024?'...",
  "data": {
    "pivot_table": [...],
    "columns": ["gSales"],
    "filters": {...}
  }
}
```

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **CORS Configuration**: Allows requests from `localhost:3000`
2. **Error Handling**: Proper error responses for frontend consumption
3. **Data Formatting**: Structured responses with charts and analysis data
4. **Real-time Processing**: Fast response times for interactive queries

## Troubleshooting

### Common Issues

1. **Data File Not Found**: Update the `DATA_PATH` in `enhanced_fastapi.py`
2. **API Key Issues**: Ensure your Perplexity API key is valid and has credits
3. **Port Conflicts**: If port 8000 is in use, modify the port in `uvicorn.run()`
4. **Dependencies**: Make sure all packages are installed correctly

### Logs

The server logs important events to `deep_intelligence_errors.log` for debugging.

## Development

To run in development mode with auto-reload:

```bash
uvicorn enhanced_fastapi:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

For production deployment, consider:

1. Using a production ASGI server like Gunicorn
2. Setting up proper environment variables
3. Configuring HTTPS
4. Setting up monitoring and logging
5. Using a reverse proxy like Nginx

