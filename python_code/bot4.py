import pandas as pd
import requests
import json
import re
import streamlit as st
import plotly.express as px
import logging
import os
from datetime import datetime
from pathlib import Path
import colorsys
import random

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, using system env vars

# Setup logging for error tracking
# Purpose: Logs errors to a file for debugging, improving robustness (Requirement 5)
logging.basicConfig(filename="chatbot_errors.log", level=logging.ERROR, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Load API key from environment - REQUIRED for security
# Note: If using secrets.toml, create it in .streamlit/ with: [secrets] PPLX_API_KEY1 = "your_key"
PPLX_API_KEY1 = os.getenv("PPLX_API_KEY1")
if not PPLX_API_KEY1:
    raise ValueError("PPLX_API_KEY1 environment variable is required. Please set it in your .env file, Streamlit secrets.toml, or environment.")

# Path to the Excel file - should be set via environment variable
default_data_path = Path(__file__).resolve().parent.parent / "backend" / "yearly_data.csv"
DATA_PATH = os.getenv("DATA_PATH", str(default_data_path))
LOGO_PATH = os.getenv("LOGO_PATH", None)  # Optional - only if using Streamlit UI

# Cache data loading to optimize performance
# Purpose: Reduces load time for large dataset (~96,000 rows) by caching (Requirement 4)
@st.cache_data
def load_data():
    # Purpose: Loads Excel data and validates it
    try:
        df = pd.read_excel(DATA_PATH)
        if df.empty:
            st.error("Dataset is empty. Please check the Excel file.")
            logging.error("Empty dataset loaded")
            return None
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        logging.error(f"Data load error: {e}")
        return None

# Function to detect follow-up questions
# Purpose: Identifies if a query references prior context (e.g., Carie Marie, Convenience) to maintain conversation flow
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
# Purpose: Fetches intelligent responses from Perplexity API, logging errors for debugging (Requirement 5)
def query_perplexity(prompt, conversation_history=None):
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY1}",
        "Content-Type": "application/json"
    }
    messages = [
        {
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
        }
    ]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})
    payload = {
        "model": "sonar-pro",
        "messages": messages,
        "max_tokens": 1000  # Increased to avoid truncation
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        logging.error(f"Perplexity API error: {e}")
        return f"Oops, something went wrong with the API: {e}"

# Function to parse query
# Purpose: Extracts columns, filters, and query type (trend/loser) to structure data analysis
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
    
    months = [
        "january", "february", "march", "april", "may", "june", "july",
        "september", "october", "november", "december",
        "jan", "feb", "mar", "apr", "may", "jun", "jul",
        "sep", "oct", "nov", "dec"
    ]
    for month in months:
        if month in query:
            month_map = {
                "jan": "Jan", "feb": "Feb", "mar": "Mar", "apr": "Apr",
                "may": "May", "jun": "Jun", "jul": "Jul",
                "sep": "Sep", "oct": "Oct", "nov": "Nov", "dec": "Dec"
            }
            filters["Month Name"] = month_map.get(month, month[:3].capitalize())
    
    return columns, filters, is_trend_query, is_loser_query

# Function to calculate year-over-year growth rates
# Purpose: Computes growth rates for numerical metrics to support trend analysis
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
# Purpose: Aggregates data for analysis, adds profitability metrics, and handles cost driver queries for all category values (Requirements 7, 8)
def pivot_data(df, columns, filters, is_trend_query, is_loser_query, query_lower=""):
    filtered_df = df.copy()
    for key, value in filters.items():
        if value is not None and key != "query_lower":
            filtered_df = filtered_df[filtered_df[key] == value]
    
    if not columns:
        columns = ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"]
    
    # Ensure numerical columns are float and handle NaN to prevent TypeError
    for col in columns:
        if col in filtered_df.columns:
            filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce').fillna(0)
    
    pivot_columns = [k for k in filters.keys() if k not in ["Year", "Month Name", "query_lower"]]
    if is_trend_query:
        pivot_columns = ["Year"] + pivot_columns
        pivot_table = filtered_df.pivot_table(
            values=columns,
            index=pivot_columns,
            aggfunc="sum",
            fill_value=0
        ).reset_index()
        if pivot_columns[1:]:
            pivot_table = calculate_growth_rates(pivot_table, columns, pivot_columns[1:])
        else:
            pivot_table = calculate_growth_rates(pivot_table, columns, [])
    elif pivot_columns:
        pivot_table = filtered_df.pivot_table(
            values=columns,
            index=pivot_columns,
            aggfunc="sum",
            fill_value=0
        ).reset_index()
        if "cost drivers" in query_lower:
            cost_columns = [col for col in ["Price Downs", "Perm. Disc.", "Group Cost", "LTA"] if col in columns]
            if cost_columns:
                pivot_table["Total Cost"] = pivot_table[cost_columns].sum(axis=1)
                # Show all values in category, not just top/bottom 3 (Requirement 8)
                pivot_table = pivot_table.sort_values(by="Total Cost", ascending=False)
        elif columns and is_loser_query:
            pivot_table = pivot_table.sort_values(by=columns[0], ascending=True).head(3)
        elif columns:
            pivot_table = pivot_table.sort_values(by=columns[0], ascending=False).head(3)
    else:
        pivot_table = filtered_df[columns].agg("sum").reset_index()
        pivot_table.columns = ["Metric", "Value"]
    
    # Round numerical columns and handle NaN
    for col in columns:
        if col in pivot_table.columns:
            pivot_table[col] = pd.to_numeric(pivot_table[col], errors='coerce').fillna(0).round(0).astype(int)
    
    # Add profitability metric (Requirement 7)
    if "gSales" in pivot_table.columns and "fGP" in pivot_table.columns:
        pivot_table["Profit Margin %"] = (pivot_table["fGP"] / pivot_table["gSales"] * 100).round(1).where(pivot_table["gSales"] != 0, 0)
    
    return pivot_table, filtered_df

# Function to calculate percentage of total gSales
# Purpose: Computes gSales contribution for each category, ensuring robust calculations
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
# Purpose: Prepares data context for Perplexity API, formatting numerical values to prevent errors
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

# Streamlit web interface
# Purpose: Creates an interactive UI with enhanced filters, custom styling, and progress indicators (Requirements 1, 3, 9, 10)
def run_streamlit():
    # Apply custom styling with dark background and logo (Requirement 9)
    st.markdown("""
        <style>
        .main {background-color: #1e1e1e;}
        .stButton>button {background-color: #4CAF50; color: white; border-radius: 5px;}
        .stSelectbox {background-color: #2c2c2c; color: white;}
        .stMultiselect {background-color: #2c2c2c; color: white;}
        h1 {color: #ffffff;}
        .stMarkdown {color: #d3d3d3;}
        </style>
    """, unsafe_allow_html=True)
    
    # Display company logo subtly (Requirement 9)
    if os.path.exists(LOGO_PATH):
        st.image(LOGO_PATH, width=150)  # Reduced size for subtlety
    
    st.title("Vector AI Deep Intelligence - BVG")
    st.markdown("Ask questions about finance data (2023–July 2025). Use filters to narrow down your query!")
    
    df = load_data()
    if df is None:
        st.stop()
    
    # Simplified sidebar filters with collapsible sections (Requirement 1, New: Simplified Layout)
    with st.sidebar:
        st.header("Filter Data")
        with st.expander("Time Filters", expanded=True):
            years = st.multiselect("Select Years", options=sorted(df["Year"].unique()), default=df["Year"].unique(), key="years")
            months = st.multiselect("Select Months", options=sorted(df["Month Name"].unique()), key="months")
        with st.expander("Segment Filters", expanded=False):
            businesses = st.multiselect("Select Businesses", options=sorted(df["Business"].unique()), key="businesses")
            channels = st.multiselect("Select Channels", options=sorted(df["Channel"].unique()), key="channels")
            customers = st.multiselect("Select Customers", options=sorted(df["Customer"].unique()), key="customers")
            brands = st.multiselect("Select Brands", options=sorted(df["Brand"].unique()), key="brands")
            categories = st.multiselect("Select Categories", options=sorted(df["Category"].unique()), key="categories")
        
        if years:
            df = df[df["Year"].isin(years)]
        if months:
            df = df[df["Month Name"].isin(months)]
        if businesses:
            df = df[df["Business"].isin(businesses)]
        if channels:
            df = df[df["Channel"].isin(channels)]
        if customers:
            df = df[df["Customer"].isin(customers)]
        if brands:
            df = df[df["Brand"].isin(brands)]
        if categories:
            df = df[df["Category"].isin(categories)]
    
    # Display metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Rows", len(df))
    with col2:
        st.metric("Years Covered", f"{df['Year'].min()} - {df['Year'].max()}")
    with col3:
        st.metric("Business Segments", len(df['Business'].unique()))
    col4, col5, col6, col7 = st.columns(4)
    with col4:
        st.metric("Channels", len(df['Channel'].unique()))
    with col5:
        st.metric("Customers", len(df['Customer'].unique()))
    with col6:
        st.metric("Brands", len(df['Brand'].unique()))
    with col7:
        st.metric("Categories", len(df['Category'].unique()))
    
    # Clear chat history button (Requirement 3)
    if st.button("Clear Chat History"):
        st.session_state.messages = []
        st.rerun()
    
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Handle user input (Removed dynamic query suggestions as per new requirement)
    if prompt := st.chat_input("Ask a question (e.g., 'Which channel had the least gSales till date?')"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        with st.chat_message("assistant"):
            # Progress bar for long-running queries (Requirement 10)
            with st.spinner("Analyzing data..."):
                progress_bar = st.progress(0)
                context, columns, filters, pivot_table, filtered_df, is_trend_query, is_loser_query = generate_data_context(
                    df, prompt, st.session_state.messages[:-1]
                )
                progress_bar.progress(50)
                full_prompt = f"Based on the following data, answer the question: {prompt}\n\n{context}"
                response = query_perplexity(full_prompt, st.session_state.messages[:-1])
                progress_bar.progress(100)
                st.markdown(response)
                
                pivot_columns = [k for k in filters.keys() if k not in ["Year", "Month Name", "query_lower"]]
                if "gSales" in pivot_table.columns and pivot_table.shape[0] > 0 and pivot_columns and not is_trend_query:
                    chart_data = pivot_table.sort_values(by="gSales", ascending=is_loser_query).head(3)  # Top 3 only
                    total_gsales = filtered_df["gSales"].sum()  # Total from all categories
                    if total_gsales > 0:
                        chart_data = chart_data.copy()
                        chart_data["Percent_of_Total"] = (chart_data["gSales"] / total_gsales) * 100
                        chart_data["Display_Label"] = chart_data.apply(
                            lambda x: f"{x['Percent_of_Total']:.1f}% (€{x['gSales']:,.0f})", axis=1
                        )

                        # Bar chart
                        color_map = {
                            "Food": "#66b3ff",
                            "Household & Beauty": "#ff9999",
                            "Kinetica": "#3366cc",
                            "Brillo, Goddards & KMPL": "#ffcc99",
                            "Green Aware": "#99ff99",
                            "Cali Cali": "#c2c2f0",
                        }
                        all_categories = pivot_table[pivot_columns[0]].unique().tolist()
                        for cat in all_categories:
                            if cat not in color_map:
                                h, s, v = random.random(), 0.5 + random.random() / 2, 0.7 + random.random() / 5
                                r, g, b = [int(255 * i) for i in colorsys.hsv_to_rgb(h, s, v)]
                                color_map[cat] = f"#{r:02x}{g:02x}{b:02x}"

                        fig_bar = px.bar(
                            chart_data,
                            x=pivot_columns[0],
                            y="gSales",
                            title=f"gSales by {pivot_columns[0]} for {prompt}",
                            labels={"gSales": "Gross Sales (€)", pivot_columns[0]: pivot_columns[0].title()},
                            color=pivot_columns[0],
                            color_discrete_map=color_map
                        )
                        fig_bar.update_traces(
                            text=chart_data["Display_Label"],
                            textposition="auto"
                        )
                        fig_bar.update_layout(
                            showlegend=True,
                            legend_title_text=pivot_columns[0].title(),
                            paper_bgcolor="rgba(0,0,0,0)",
                            plot_bgcolor="rgba(0,0,0,0)",
                            font=dict(size=13),
                            title_x=0.5
                        )
                        st.plotly_chart(fig_bar, use_container_width=True)
                
                # Removed "Explain Why" button (Previous requirement)
                # Note: No explanation for low performers, as requested
                
                if pivot_columns and pivot_table.shape[0] > 0 and not is_trend_query:
                    numerical_columns = [col for col in ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"] if col in pivot_table.columns]
                    chart_data = pivot_table.sort_values(by=numerical_columns[0], ascending=is_loser_query).head(3)  # Top 3 only
                    for col in numerical_columns:
                        total = filtered_df[col].sum()  # Total from all categories
                        if total > 0:
                            chart_data = chart_data.copy()
                            chart_data["Percent_of_Total"] = (chart_data[col] / total) * 100
                            chart_data["Display_Label"] = chart_data.apply(
                                lambda x: f"{x['Percent_of_Total']:.1f}% (€{x[col]:,.0f})" if col != "Cases" else f"{x['Percent_of_Total']:.1f}% ({x[col]:,.0f})", axis=1
                            )

                            # Pie chart
                            color_map = {
                                "Food": "#66b3ff",
                                "Household & Beauty": "#ff9999",
                                "Kinetica": "#3366cc",
                                "Brillo, Goddards & KMPL": "#ffcc99",
                                "Green Aware": "#99ff99",
                                "Cali Cali": "#c2c2f0",
                            }
                            all_categories = pivot_table[pivot_columns[0]].unique().tolist()
                            for cat in all_categories:
                                if cat not in color_map:
                                    h, s, v = random.random(), 0.5 + random.random() / 2, 0.7 + random.random() / 5
                                    r, g, b = [int(255 * i) for i in colorsys.hsv_to_rgb(h, s, v)]
                                    color_map[cat] = f"#{r:02x}{g:02x}{b:02x}"

                            fig_pie = px.pie(
                                chart_data,
                                names=pivot_columns[0],
                                values=col,
                                title=f"Distribution of {col} by {pivot_columns[0]} for {prompt}",
                                color=pivot_columns[0],
                                color_discrete_map=color_map,
                                hole=0.4
                            )
                            fig_pie.update_traces(
                                text=chart_data["Display_Label"],
                                textinfo="text",
                                textposition="inside",
                                insidetextorientation="auto",
                                hovertemplate="<b>%{label}</b><br>€%{value:,.0f}<extra></extra>" if col != "Cases" else "<b>%{label}</b><br>%{value:,.0f}<extra></extra>"
                            )
                            fig_pie.update_layout(
                                showlegend=True,
                                legend_title_text=pivot_columns[0].title(),
                                paper_bgcolor="rgba(0,0,0,0)",
                                plot_bgcolor="rgba(0,0,0,0)",
                                font=dict(size=13),
                                title_x=0.5
                            )
                            st.plotly_chart(fig_pie, use_container_width=True)
                
                # Enhanced cost driver chart with percentages and tooltips (Requirement 8)
                if "cost drivers" in prompt.lower() and pivot_columns and pivot_table.shape[0] > 0:
                    cost_columns = [col for col in ["Price Downs", "Perm. Disc.", "Group Cost", "LTA"] if col in pivot_table.columns]
                    if cost_columns:
                        chart_data = pivot_table.melt(id_vars=pivot_columns, value_vars=cost_columns, var_name="Cost Type", value_name="Value")
                        # Calculate percentage of total cost for tooltips
                        chart_data["Percentage"] = chart_data.groupby(pivot_columns[0])["Value"].transform(lambda x: (x / x.sum() * 100).round(1))
                        fig_bar = px.bar(
                            chart_data,
                            x=pivot_columns[0],
                            y="Value",
                            color="Cost Type",
                            title=f"Cost Drivers by {pivot_columns[0]} for {prompt}",
                            labels={"Value": "Cost (€)", pivot_columns[0]: pivot_columns[0].title(), "Cost Type": "Cost Type"},
                            custom_data=["Percentage"]
                        )
                        fig_bar.update_traces(
                            texttemplate="€%{y:,.0f}", 
                            textposition="auto",
                            hovertemplate="%{x}<br>%{y:,.0f}€ (%{customdata[0]}%)"
                        )
                        st.plotly_chart(fig_bar, use_container_width=True)
                
                # Animated trend chart (Requirement 6)
                if is_trend_query and pivot_table.shape[0] > 0:
                    numerical_columns = [col for col in ["Cases", "gSales", "Price Downs", "Perm. Disc.", "Group Cost", "LTA", "fGP"] if col in pivot_table.columns]
                    chart_data = pivot_table
                    if pivot_columns:
                        last_year = pivot_table["Year"].max()
                        top_5 = pivot_table[pivot_table["Year"] == last_year].sort_values(by=numerical_columns[0], ascending=False).head(5)[pivot_columns[0]]
                        chart_data = pivot_table[pivot_table[pivot_columns[0]].isin(top_5)]
                    for col in numerical_columns:
                        fig_line = px.line(
                            chart_data,
                            x="Year",
                            y=col,
                            color=pivot_columns[0] if pivot_columns else None,
                            animation_frame="Year",  # Animate by year
                            title=f"Trend of {col} {'by ' + pivot_columns[0].title() if pivot_columns else 'Total'} for {prompt}",
                            labels={col: f"{col} (€)" if col != "Cases" else col, "Year": "Year", pivot_columns[0]: pivot_columns[0].title() if pivot_columns else "Total"}
                        )
                        fig_line.update_traces(mode="lines+markers", marker=dict(size=8))
                        fig_line.update_layout(legend_title=pivot_columns[0].title() if pivot_columns else "Total")
                        st.plotly_chart(fig_line, use_container_width=True)
                
                st.session_state.messages.append({"role": "assistant", "content": response})

# Run the chatbot
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--cli":
        def chatbot_cli():
            df = load_data()
            if df is None:
                print("Failed to load data. Exiting.")
                return
            print("Welcome to the Finance Data Chatbot! Type 'exit' to quit.")
            conversation_history = []
            while True:
                user_query = input("Ask a question: ")
                if user_query.lower() == 'exit':
                    break
                context, columns, filters, _, _, _, _ = generate_data_context(df, user_query, conversation_history)
                prompt = f"Based on the following data, answer the question: {user_query}\n\n{context}"
                response = query_perplexity(prompt, conversation_history)
                print(f"\nAnswer: {response}\n")
                conversation_history.append({"role": "user", "content": user_query})
                conversation_history.append({"role": "assistant", "content": response})
                conversation_history = conversation_history[-4:]
        chatbot_cli()
    else:
        run_streamlit()
