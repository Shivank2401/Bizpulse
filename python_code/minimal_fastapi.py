import os
import requests
import json
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, using system env vars

# Setup logging
logging.basicConfig(filename="deep_intelligence_errors.log", level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load API key from environment - REQUIRED, no fallback for security
PPLX_API_KEY1 = os.getenv("PPLX_API_KEY1")
if not PPLX_API_KEY1:
    raise ValueError("PPLX_API_KEY1 environment variable is required. Please set it in your .env file or environment.")

# Initialize FastAPI app
app = FastAPI(title="Deep Intelligence API - Minimal Version", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    conversation_history: Optional[List[ChatMessage]] = []
    filters: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    response: str
    timestamp: str
    context: str
    charts: Optional[List[Dict[str, Any]]] = []
    data: Optional[Dict[str, Any]] = {}

def query_perplexity(prompt, conversation_history=None):
    """Query Perplexity API"""
    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {PPLX_API_KEY1}", "Content-Type": "application/json"}
    messages = [{
        "role": "system",
        "content": (
            "You are Vector AI, a friendly financial data analyst for BVG. "
            "Provide intelligent business insights and recommendations. "
            "All monetary values are in Euros (�). Be conversational and engaging."
        )
    }]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})
    payload = {"model": "sonar-pro", "messages": messages, "max_tokens": 1000}
    
    try:
        logger.info("Sending request to Perplexity API")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        logger.info("Received response from Perplexity API")
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        logger.error(f"Perplexity API error: {e}")
        return f"I apologize, but I'm experiencing technical difficulties. Please try again later."

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "minimal"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.query}")
        
        # Simple prompt without data processing
        prompt = f"Please analyze and provide insights for this business question: {request.query}"
        
        response = query_perplexity(prompt, request.conversation_history)
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().strftime("%I:%M %p IST on %B %d, %Y"),
            context="Minimal version - data processing not available",
            data={"note": "This is a minimal version without data processing capabilities"}
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/filter-options")
async def get_filter_options():
    return {
        "years": ["2023", "2024", "2025"],
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "businesses": ["Brillo, Goddards & KMPL", "Cali Cali", "Food", "Green Aware", "Household & Beauty", "Kinetica"],
        "channels": ["Convenience", "Grocery", "International", "Online", "Sports & Others", "Wholesale"],
        "brands": ["Asda", "Babykind", "Bensons", "Bonne Maman", "Brillo", "BV Honey", "Koka", "McDonnells"],
        "categories": ["Pickles", "Plastic sacks", "Polish", "Pots", "Preserves", "Protein Bar", "Protein Milk", "Shopping bags", "Snacking"],
        "customers": ["Aldi ROI", "Amazon", "Australia", "Austria", "Bahrain", "Barry Group", "Belgium", "BWG", "Canada"]
    }

@app.get("/data-summary")
async def get_data_summary():
    return {
        "total_rows": "Data processing not available in minimal version",
        "year_range": "2023 - 2025",
        "business_segments": 6,
        "channels": 6,
        "customers": 50,
        "brands": 25,
        "categories": 15
    }

if __name__ == "__main__":
    logger.info("Starting Minimal Deep Intelligence FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
