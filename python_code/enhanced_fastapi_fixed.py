import pandas as pd
import requests
import json
import re
import logging
import os
from datetime import datetime
from pathlib import Path
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

# Path to the Excel file - repo-relative default (can be overridden by DATA_PATH env)
DEFAULT_XLSX = Path(__file__).resolve().parent / "yearly_data_1.xlsx"
DATA_PATH = os.getenv("DATA_PATH", str(DEFAULT_XLSX))

# Initialize FastAPI app
app = FastAPI(title="Deep Intelligence API", version="1.0.0")

# FIXED CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        # Add your production domains here
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight response for 1 hour
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

# Payload shape used by the frontend insights modal
class InsightsRequest(BaseModel):
    message: str
    chart_title: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = []

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
    """Load data with caching. Tries Excel first, then falls back to CSV in backend folder."""
    global df_global
    if df_global is not None:
        return df_global

    # 1) Try Excel from DATA_PATH
    try:
        logger.info(f"Attempting to load data from {DATA_PATH}")
        df = pd.read_excel(DATA_PATH)
        if df.empty:
            raise ValueError("Dataset is empty. Please check the Excel file.")
        # Normalize columns and dtypes
        df.columns = df.columns.str.strip()
        if 'Month Name' not in df.columns and 'Month_Name' in df.columns:
            df.rename(columns={'Month_Name': 'Month Name'}, inplace=True)
        # Ensure Year is numeric int
        if 'Year' in df.columns:
            df['Year'] = pd.to_numeric(df['Year'], errors='coerce').fillna(0).astype(int)
        # Coerce known numeric columns
        for col in ['gSales', 'fGP', 'Cases', 'Price Downs', 'Perm. Disc.', 'Group Cost', 'LTA']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        df_global = df
        logger.info(f"Data loaded successfully from Excel: {len(df_global)} rows")
        return df_global
    except Exception as e:
        logger.warning(f"Excel load failed: {e}. Trying CSV fallback...")

    # 2) Fallback to CSV at backend/yearly_data.csv
    try:
        from pathlib import Path
        here = Path(__file__).resolve().parent
        csv_path = (here.parent / 'backend' / 'yearly_data.csv')
        logger.info(f"Attempting to load CSV from {csv_path}")
        df = pd.read_csv(csv_path)
        if df.empty:
            raise ValueError("CSV dataset is empty.")
        # Normalize expected column names if needed
        df.columns = df.columns.str.strip()
        # Ensure Month Name column variant exists
        if 'Month Name' not in df.columns and 'Month_Name' in df.columns:
            df.rename(columns={'Month_Name': 'Month Name'}, inplace=True)
        # Ensure Year is numeric int
        if 'Year' in df.columns:
            df['Year'] = pd.to_numeric(df['Year'], errors='coerce').fillna(0).astype(int)
        for col in ['gSales', 'fGP', 'Cases', 'Price Downs', 'Perm. Disc.', 'Group Cost', 'LTA']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        df_global = df
        logger.info(f"Data loaded successfully from CSV: {len(df_global)} rows")
        return df_global
    except Exception as e:
        logger.error(f"CSV fallback failed: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading data (Excel and CSV fallback failed): {e}")

# Function to detect follow-up questions
def is_follow_up(query, prev_messages):
    follow_up_indicators = ["more", "what about", "tell me", "further", "also", "next", "continue", "same", "cost", "drivers"]
    query_lower = query.lower()
    if any(indicator in query_lower for indicator in follow_up_indicators):
        return True
    prev_entities = set()
    for msg in prev_messages:
        # Handle both dict and object formats
        role = msg.get("role") if isinstance(msg, dict) else (msg.role if hasattr(msg, 'role') else "")
        content = msg.get("content") if isinstance(msg, dict) else (msg.content if hasattr(msg, 'content') else "")
        
        if role == "user" and content:
            columns, filters, _, _ = parse_query(content)
            for key, value in filters.items():
                if value and key != "Year" and key != "Month Name":
                    prev_entities.add(value)
            for col in columns:
                prev_entities.add(col)
        if role == "assistant" and content:
            for entity in ["Business", "Channel", "Customer", "Brand", "Category", "gSales", "fGP", "Cases",
                           "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "cost drivers"]:
                if entity.lower() in content.lower():
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
            "Analyze the provided data and deliver a detailed, confident answer in a conversational tone. "
            "All monetary values are in Euros (€). State results definitively, e.g., 'After digging into the data, [answer].' "
            "Include trends (2023–2025, up to July), growth rates (%), and percentage of total gSales where relevant. "
            "For underperformers, identify the lowest performers with specific numbers. "
            "For cost drivers, highlight top contributors to costs (Price Downs, Perm. Disc., Group Cost, LTA) and their impact on fGP. "
            "Always provide 3-5 specific, actionable recommendations with clear 'why' and 'how' for each. "
            "Use conversation history for context in follow-ups. "
            "For requests like drafting emails to CEO or management, use professional business tone and format appropriately with proper salutations and sign-offs. "
            "Keep it engaging and provide comprehensive analysis with tables and visual formatting where helpful."
        )
    }]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})
    payload = {"model": "sonar-pro", "messages": messages, "max_tokens": 2000}
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

    # Default desired columns
    if not columns:
        columns = ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"]

    # Restrict to columns that actually exist to avoid KeyError
    selected_columns = [c for c in columns if c in filtered_df.columns]
    if not selected_columns:
        # Fallback to the safest known metrics
        selected_columns = [c for c in ["gSales", "fGP", "Cases"] if c in filtered_df.columns]
    
    for col in selected_columns:
        if col in filtered_df.columns:
            filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce').fillna(0)

    pivot_columns = [k for k in filters.keys() if k not in ["Year", "Month Name", "query_lower"]]
    if is_trend_query:
        pivot_columns = ["Year"] + pivot_columns
        pivot_table = filtered_df.pivot_table(values=selected_columns, index=pivot_columns, aggfunc="sum", fill_value=0).reset_index()
        if pivot_columns[1:]:
            pivot_table = calculate_growth_rates(pivot_table, selected_columns, pivot_columns[1:])
        else:
            pivot_table = calculate_growth_rates(pivot_table, selected_columns, [])
    elif pivot_columns:
        pivot_table = filtered_df.pivot_table(values=selected_columns, index=pivot_columns, aggfunc="sum", fill_value=0).reset_index()
        if "cost drivers" in query_lower:
            cost_columns = [col for col in ["Price Downs", "Perm. Disc.", "Group Cost", "LTA"] if col in selected_columns]
            if cost_columns:
                pivot_table["Total Cost"] = pivot_table[cost_columns].sum(axis=1)
                pivot_table = pivot_table.sort_values(by="Total Cost", ascending=False)
        elif selected_columns and is_loser_query:
            pivot_table = pivot_table.sort_values(by=selected_columns[0], ascending=True).head(3)
        elif selected_columns:
            pivot_table = pivot_table.sort_values(by=selected_columns[0], ascending=False).head(3)
    else:
        if selected_columns:
            pivot_table = filtered_df[selected_columns].agg("sum").reset_index()
            pivot_table.columns = ["Metric", "Value"]
        else:
            pivot_table = pd.DataFrame({"Metric": [], "Value": []})

    for col in selected_columns:
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
def generate_data_context(df, query, prev_messages=None, preset_filters: Optional[Dict[str, Any]] = None):
    columns, filters, is_trend_query, is_loser_query = parse_query(query)
    # Merge preset filters (from frontend context) with parsed filters
    if preset_filters:
        for k, v in preset_filters.items():
            if v is not None:
                filters[k] = v
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

# ----------------------------
# Friendly summary generation
# ----------------------------
def _format_euro(value: float) -> str:
    try:
        v = float(value)
    except Exception:
        return str(value)
    if abs(v) >= 1_000_000:
        return f"€{v/1_000_000:.1f}M"
    if abs(v) >= 1_000:
        return f"€{v/1_000:.1f}k"
    return f"€{int(v):,}"

def _format_pct(value: float) -> str:
    try:
        return f"{float(value):.1f}%"
    except Exception:
        return str(value)

def build_top_business_summary(pivot_table: pd.DataFrame, filters: Dict[str, Any]) -> Optional[str]:
    if pivot_table is None or pivot_table.empty:
        return None
    # Expecting columns Business, gSales, % of Total gSales
    needed_cols = {"Business", "gSales"}
    if not needed_cols.issubset(set(pivot_table.columns)):
        return None
    pt = pivot_table.copy()
    pt = pt.sort_values(by="gSales", ascending=False)
    year_text = f" {filters.get('Year')}" if filters.get('Year') else ""
    top = pt.iloc[0]
    rest = pt.iloc[1:3]
    parts = []
    parts.append(f"Top business in{year_text}: {top['Business']} — {_format_euro(top['gSales'])}" + \
                 (f" ({_format_pct(top.get('% of Total gSales', None))})" if '% of Total gSales' in pt.columns else ""))
    if not rest.empty:
        sub = ", ".join([f"{row['Business']} {_format_euro(row['gSales'])}" + \
                           (f" ({_format_pct(row.get('% of Total gSales', None))})" if '% of Total gSales' in pt.columns else "")
                           for _, row in rest.iterrows()])
        parts.append(f"Next: {sub}")
    return "\n".join(parts)

def build_cost_driver_summary(pivot_table: pd.DataFrame, filters: Dict[str, Any]) -> Optional[str]:
    if pivot_table is None or pivot_table.empty:
        return None
    cost_cols = [c for c in ["Group Cost", "LTA", "Perm. Disc.", "Price Downs"] if c in pivot_table.columns]
    if not cost_cols:
        return None
    # If Business exists, summarize by Business; otherwise use first categorical column
    cat_col = None
    for key in ["Business", "Brand", "Category", "Channel"]:
        if key in pivot_table.columns:
            cat_col = key
            break
    if cat_col is None:
        return None

    pt = pivot_table.copy()
    # Ensure numeric
    for c in cost_cols:
        pt[c] = pd.to_numeric(pt[c], errors='coerce').fillna(0.0)
    pt["Total Cost"] = pt[cost_cols].sum(axis=1)
    pt = pt.groupby(cat_col, as_index=False).agg({**{c: "sum" for c in cost_cols}, "Total Cost": "sum"})
    pt = pt.sort_values(by="Total Cost", ascending=False)

    year_text = f" {filters.get('Year')}" if filters.get('Year') else ""
    top_n = pt.head(3)
    lines = [f"Top cost drivers by {cat_col} in{year_text}:"]
    for _, row in top_n.iterrows():
        parts = [
            f"{cat_col}: {row[cat_col]}",
            f"Total: {_format_euro(row['Total Cost'])}",
            f"Group: {_format_euro(row.get('Group Cost', 0))}",
            f"LTA: {_format_euro(row.get('LTA', 0))}",
            f"PermDisc: {_format_euro(row.get('Perm. Disc.', 0))}",
            f"PriceDowns: {_format_euro(row.get('Price Downs', 0))}",
        ]
        lines.append(" - " + ", ".join(parts))
    return "\n".join(lines)

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

# Endpoint matching the frontend insights payload
@app.post("/insights/chat", response_model=ChatResponse)
async def insights_chat_alias(req: InsightsRequest):
    try:
        df = load_data()
        if df is None:
            raise HTTPException(status_code=500, detail="Failed to load data.")

        query_text = req.message or ""
        context_str = ""
        if req.context:
            try:
                context_str = f"\n\nContext: {json.dumps(req.context, default=str)[:1500]}"
            except Exception:
                context_str = ""

        full_query = f"{query_text}{context_str}"

        # Derive structured filters from context
        preset_filters = {}
        ctx = req.context or {}
        # year / selectedYears
        year_val = ctx.get('year')
        if not year_val:
            years = ctx.get('selectedYears') or []
            if years:
                year_val = years[0]
        if year_val:
            try:
                preset_filters['Year'] = int(year_val)
            except Exception:
                pass
        # month / selectedMonths
        months = ctx.get('selectedMonths') or []
        if months:
            preset_filters['Month Name'] = str(months[0])
        # business / selectedBusinesses
        business = ctx.get('business') or None
        if not business:
            businesses = ctx.get('selectedBusinesses') or []
            if businesses:
                business = businesses[0]
        if business:
            preset_filters['Business'] = str(business)

        # Convert Pydantic ChatMessage objects to dicts for JSON serialization
        conversation_history_dicts = []
        if req.conversation_history:
            for msg in req.conversation_history:
                if hasattr(msg, 'dict'):
                    conversation_history_dicts.append(msg.dict())
                elif isinstance(msg, dict):
                    conversation_history_dicts.append(msg)
                else:
                    # Fallback for other formats
                    conversation_history_dicts.append({"role": getattr(msg, 'role', ''), "content": getattr(msg, 'content', '')})
        
        context, columns, filters, pivot_table, filtered_df, is_trend_query, is_loser_query = generate_data_context(
            df, full_query, conversation_history_dicts, preset_filters
        )

        # Format pivot table data for better context
        pivot_data_str = ""
        if not pivot_table.empty:
            # Limit to top 10 rows and format nicely
            top_rows = pivot_table.head(10)
            pivot_data_str = f"\n\nKey Data Summary:\n{top_rows.to_string(index=False)}\n"
            if len(pivot_table) > 10:
                pivot_data_str += f"\n(Showing top 10 of {len(pivot_table)} rows)\n"

        # Build simple prompt like bot4.py - let system prompt handle the structure
        full_prompt = f"Based on the following data, answer the question: {req.message}\n\n{context}{pivot_data_str}"
        
        # Always use AI for detailed responses
        response_text = query_perplexity(full_prompt, conversation_history_dicts)

        return ChatResponse(
            response=response_text,
            timestamp=datetime.now().strftime("%I:%M %p IST on %B %d, %Y"),
            context=context,
            data={
                "pivot_table": pivot_table.to_dict('records') if not pivot_table.empty else [],
                "columns": columns,
                "filters": filters,
                "is_trend_query": is_trend_query,
                "is_loser_query": is_loser_query,
                "total_rows": len(filtered_df)
            }
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Insights chat error: {e}")
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
    logger.info("Starting Enhanced Deep Intelligence FastAPI server with CORS fix")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
