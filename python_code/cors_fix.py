#!/usr/bin/env python3
"""
CORS Fix for Deep Intelligence API
This file contains the corrected CORS configuration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app: FastAPI):
    """Setup CORS middleware with proper configuration"""
    
    # Add CORS middleware with comprehensive settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            # Add your production domains here
            # "https://yourdomain.com",
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

# Alternative CORS configuration if the above doesn't work
def setup_cors_alternative(app: FastAPI):
    """Alternative CORS configuration with more permissive settings"""
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins (NOT recommended for production)
        allow_credentials=False,  # Must be False when allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Manual CORS headers (if middleware doesn't work)
def add_cors_headers(response):
    """Add CORS headers manually to response"""
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Origin"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response
