import pandas as pd
import requests
import json
import re
import logging
import os
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

# Setup logging for error tracking
logging.basicConfig(filename="deep_intelligence_errors.log", level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load API key from environment - REQUIRED, no fallback for security
PPLX_API_KEY1 = os.getenv("PPLX_API_KEY1")
if not PPLX_API_KEY1:
    raise ValueError("PPLX_API_KEY1 environment variable is required. Please set it in your .env file or environment.")

# Path to the Excel file - should be set via environment variable
from pathlib import Path
DEFAULT_XLSX = Path(__file__).resolve().parent.parent / "backend" / "yearly_data.csv"
DATA_PATH = os.getenv("DATA_PATH", str(DEFAULT_XLSX))

# Initialize FastAPI app
app = FastAPI(title="Deep Intelligence API", version="1.0.0")

# Add CORS middleware to allow cross-origin requests from React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
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

class FilterOptionsResponse(BaseModel):
    years: List[str]
    months: List[str]
    businesses: List[str]
    channels: List[str]
    brands: List[str]
    categories: List[str]
    customers: List[str]

# Global variable to store loaded data
df_global = None

def load_data():
    """Load data with caching"""
    global df_global
    if df_global is not None:
        return df_global
    
    try:
        logger.info(f"Attempting to load data from {DATA_PATH}")
        df_global = pd.read_excel(DATA_PATH)
        if df_global.empty:
            logger.error("Empty dataset loaded")
            raise ValueError("Dataset is empty. Please check the Excel file.")
        logger.info(f"Data loaded successfully: {len(df_global)} rows")
        return df_global
    except Exception as e:
        logger.error(f"Data load error: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading data: {e}")

# Function to detect follow-up questions
def is_follow_up(query, prev_messages):
    follow_up_indicators = ["more", "what about", "tell me", "further", "also", "next", "continue", "same", "cost", "drivers"]
    query_lower = query.lower()
    if any(indicator in query_lower for indicator in follow_up_indicators):
        return True
    prev_entities = set()
    for msg in prev_messages:
        if msg["role"] == "user":
            columns, filters, _, _ = parse_query(msg["content"])
            for key, value in filters.items():
                if value and key != "Year" and key != "Month Name":
                    prev_entities.add(value)
            for col in columns:
                prev_entities.add(col)
        if msg["role"] == "assistant":
            for entity in ["Business", "Channel", "Customer", "Brand", "Category", "gSales", "fGP", "Cases",
                           "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "cost drivers"]:
                if entity.lower() in msg["content"].lower():
                    prev_entities.add(entity)
    return any(entity.lower() in query_lower for entity in prev_entities)

# Function to query Perplexity API
def query_perplexity(prompt, conversation_history=None):
    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {PPLX_API_KEY1}", "Content-Type": "application/json"}
    messages = [{
        "role": "system",
        "content": (
            "You are Vector AI, a friendly financial data analyst for BVG, assisting with actionable insights. "
            "Analyze the provided data and deliver a concise, confident answer in a conversational tone. "
            "All monetary values are in Euros (€). State results definitively, e.g., 'After digging into the data, [answer].' "
            "Include trends (2023–2025, up to July), growth rates (%), and percentage of total gSales where relevant. "
            "For underperformers, identify the lowest performers (e.g., Carie Marie with €18,029.57 gSales). "
            "For cost drivers, highlight top contributors to costs (Price Downs, Perm. Disc., Group Cost, LTA) and their impact on fGP. "
            "Always provide 1-2 specific, actionable recommendations. Use conversation history for context in follow-ups. "
            "Keep it engaging and avoid dry analysis—add a bit of flair!"
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
        raise HTTPException(status_code=500, detail=f"Oops, something went wrong with the API: {e}")

# Function to parse query
def parse_query(query):
    query = query.lower()
    filters = {}
    is_trend_query = "trend" in query or "compare" in query or "last 3 years" in query
    is_loser_query = "loser" in query or "worst" in query or "lowest" in query or "least" in query
    
    columns = []
    if "gsales" in query or "money" in query or "sales" in query:
        columns.append("gSales")
    if "fgp" in query or "profit" in query:
        columns.append("fGP")
    if "cases" in query or "inventory" in query:
        columns.append("Cases")
    if "price downs" in query or "cost drivers" in query:
        columns.append("Price Downs")
    if "perm disc" in query or "permanent discount" in query or "cost drivers" in query:
        columns.append("Perm. Disc.")
    if "group cost" in query or "cost drivers" in query:
        columns.append("Group Cost")
    if "lta" in query or "cost drivers" in query:
        columns.append("LTA")
    
    if "business" in query:
        filters["Business"] = None
    if "channel" in query:
        filters["Channel"] = None
    if "customer" in query:
        filters["Customer"] = None
    if "brand" in query:
        filters["Brand"] = None
    if "category" in query:
        filters["Category"] = None
    
    if not is_trend_query:
        for year in ["2023", "2024", "2025"]:
            if year in query:
                filters["Year"] = int(year)
    
    months = ["january", "february", "march", "april", "may", "june", "july",
              "september", "october", "november", "december",
              "jan", "feb", "mar", "apr", "may", "jun", "jul",
              "sep", "oct", "nov", "dec"]
    for month in months:
        if month in query:
            month_map = {"jan": "Jan", "feb": "Feb", "mar": "Mar", "apr": "Apr",
                         "may": "May", "jun": "Jun", "jul": "Jul",
                         "sep": "Sep", "oct": "Oct", "nov": "Nov", "dec": "Dec"}
            filters["Month Name"] = month_map.get(month, month[:3].capitalize())
    
    return columns, filters, is_trend_query, is_loser_query

# Function to calculate year-over-year growth rates
def calculate_growth_rates(pivot_table, numerical_columns, pivot_columns):
    if not pivot_columns:
        for col in numerical_columns:
            pivot_table[f"{col} Growth %"] = 0.0
            for year in [2024, 2025]:
                prev_year = year - 1
                curr = pivot_table[pivot_table["Year"] == year][col]
                prev = pivot_table[pivot_table["Year"] == prev_year][col]
                if not curr.empty and not prev.empty and prev.iloc[0] != 0:
                    growth = ((curr.iloc[0] - prev.iloc[0]) / prev.iloc[0] * 100).round(1)
                    pivot_table.loc[pivot_table["Year"] == year, f"{col} Growth %"] = growth
    else:
        for col in numerical_columns:
            pivot_table[f"{col} Growth %"] = 0.0
            for category in pivot_table[pivot_columns[0]].unique():
                for year in [2024, 2025]:
                    prev_year = year - 1
                    curr = pivot_table[(pivot_table["Year"] == year) & (pivot_table[pivot_columns[0]] == category)][col]
                    prev = pivot_table[(pivot_table["Year"] == prev_year) & (pivot_table[pivot_columns[0]] == category)][col]
                    if not curr.empty and not prev.empty and prev.iloc[0] != 0:
                        growth = ((curr.iloc[0] - prev.iloc[0]) / prev.iloc[0] * 100).round(1)
                        pivot_table.loc[(pivot_table["Year"] == year) & (pivot_table[pivot_columns[0]] == category), f"{col} Growth %"] = growth
    return pivot_table

# Function to pivot data
def pivot_data(df, columns, filters, is_trend_query, is_loser_query, query_lower=""):
    filtered_df = df.copy()
    for key, value in filters.items():
        if value is not None and key != "query_lower":
            filtered_df = filtered_df[filtered_df[key] == value]
    
    if not columns:
        columns = ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"]
    
    for col in columns:
        if col in filtered_df.columns:
            filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce').fillna(0)
    
    pivot_columns = [k for k in filters.keys() if k not in ["Year", "Month Name", "query_lower"]]
    if is_trend_query:
        pivot_columns = ["Year"] + pivot_columns
        pivot_table = filtered_df.pivot_table(values=columns, index=pivot_columns, aggfunc="sum", fill_value=0).reset_index()
        if pivot_columns[1:]:
            pivot_table = calculate_growth_rates(pivot_table, columns, pivot_columns[1:])
        else:
            pivot_table = calculate_growth_rates(pivot_table, columns, [])
    elif pivot_columns:
        pivot_table = filtered_df.pivot_table(values=columns, index=pivot_columns, aggfunc="sum", fill_value=0).reset_index()
        if "cost drivers" in query_lower:
            cost_columns = [col for col in ["Price Downs", "Perm. Disc.", "Group Cost", "LTA"] if col in columns]
            if cost_columns:
                pivot_table["Total Cost"] = pivot_table[cost_columns].sum(axis=1)
                pivot_table = pivot_table.sort_values(by="Total Cost", ascending=False)
        elif columns and is_loser_query:
            pivot_table = pivot_table.sort_values(by=columns[0], ascending=True).head(3)
        elif columns:
            pivot_table = pivot_table.sort_values(by=columns[0], ascending=False).head(3)
    else:
        pivot_table = filtered_df[columns].agg("sum").reset_index()
        pivot_table.columns = ["Metric", "Value"]
    
    for col in columns:
        if col in pivot_table.columns:
            pivot_table[col] = pd.to_numeric(pivot_table[col], errors='coerce').fillna(0).round(0).astype(int)
    
    if "gSales" in pivot_table.columns and "fGP" in pivot_table.columns:
        pivot_table["Profit Margin %"] = (pivot_table["fGP"] / pivot_table["gSales"] * 100).where(pivot_table["gSales"] != 0, 0).round(1)
    
    return pivot_table, filtered_df

# Function to calculate percentage of total gSales
def calculate_percentage(pivot_table, filtered_df, pivot_columns, is_trend_query):
    if is_trend_query:
        pivot_table["% of Total gSales"] = 0.0
        for year in pivot_table["Year"].unique():
            year_total = filtered_df[filtered_df["Year"] == year]["gSales"].sum()
            if year_total > 0:
                mask = pivot_table["Year"] == year
                pivot_table.loc[mask, "% of Total gSales"] = (pivot_table.loc[mask, "gSales"] / year_total * 100).round(1).fillna(0)
    elif "gSales" in pivot_table.columns and pivot_columns:
        total_gsales = filtered_df["gSales"].sum()
        if total_gsales > 0:
            pivot_table["% of Total gSales"] = (pivot_table["gSales"] / total_gsales * 100).round(1).fillna(0)
    return pivot_table

# Function to generate data context
def generate_data_context(df, query, prev_messages=None):
    columns, filters, is_trend_query, is_loser_query = parse_query(query)
    query_lower = query.lower()
    filters["query_lower"] = query_lower
    pivot_table, filtered_df = pivot_data(df, columns, filters, is_trend_query, is_loser_query, query_lower)
    pivot_columns = [k for k in filters.keys() if k not in ["Year", "Month Name", "query_lower"]]
    if "gSales" in pivot_table.columns:
        pivot_table = calculate_percentage(pivot_table, filtered_df, pivot_columns, is_trend_query)
    
    context = f"Data for '{query}' (values in Euros €):\n"
    pivot_table_str = pivot_table.to_string(index=False, formatters={
        col: '{:,.0f}'.format for col in pivot_table.columns if col in ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"]
    })
    context += pivot_table_str
    context += "\n\nfGP formula: fGP = gSales - Price Downs - Perm. Disc. - Group Cost - LTA"
    
    if prev_messages and is_follow_up(query, prev_messages):
        context += "\n\nPrevious conversation context:\n"
        for msg in prev_messages[-4:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            context += f"{role}: {msg['content']}\n"
    
    return context, columns, filters, pivot_table, filtered_df, is_trend_query, is_loser_query

# Health check endpoint
@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "healthy"}

# API endpoint for chatbot interaction
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request with query: {request.query}")
        df = load_data()
        if df is None:
            raise HTTPException(status_code=500, detail="Failed to load data.")

        context, columns, filters, pivot_table, filtered_df, is_trend_query, is_loser_query = generate_data_context(
            df, request.query, request.conversation_history
        )
        
        full_prompt = f"Based on the following data, answer the question: {request.query}\n\n{context}"
        response = query_perplexity(full_prompt, request.conversation_history)

        # Prepare response data
        response_data = {
            "response": response,
            "timestamp": datetime.now().strftime("%I:%M %p IST on %B %d, %Y"),
            "context": context,
            "data": {
                "pivot_table": pivot_table.to_dict('records') if not pivot_table.empty else [],
                "columns": columns,
                "filters": filters,
                "is_trend_query": is_trend_query,
                "is_loser_query": is_loser_query,
                "total_rows": len(filtered_df)
            }
        }

        return ChatResponse(**response_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

# API endpoint for filter options
@app.get("/filter-options", response_model=FilterOptionsResponse)
async def get_filter_options():
    try:
        df = load_data()
        return FilterOptionsResponse(
            years=sorted(df["Year"].astype(str).unique().tolist()),
            months=sorted(df["Month Name"].unique().tolist()),
            businesses=sorted(df["Business"].unique().tolist()),
            channels=sorted(df["Channel"].unique().tolist()),
            brands=sorted(df["Brand"].unique().tolist()),
            categories=sorted(df["Category"].unique().tolist()),
            customers=sorted(df["Customer"].unique().tolist())
        )
    except Exception as e:
        logger.error(f"Filter options error: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting filter options: {e}")

# API endpoint for data summary
@app.get("/data-summary")
async def get_data_summary():
    try:
        df = load_data()
        return {
            "total_rows": len(df),
            "year_range": f"{df['Year'].min()} - {df['Year'].max()}",
            "business_segments": len(df['Business'].unique()),
            "channels": len(df['Channel'].unique()),
            "customers": len(df['Customer'].unique()),
            "brands": len(df['Brand'].unique()),
            "categories": len(df['Category'].unique())
        }
    except Exception as e:
        logger.error(f"Data summary error: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting data summary: {e}")

if __name__ == "__main__":
    logger.info("Starting Enhanced Deep Intelligence FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
