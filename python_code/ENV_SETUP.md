# Environment Variables Setup Guide

## Quick Start

1. **Copy the example file:**
   `ash
   copy .env.example .env
   `

2. **Edit the .env file with your actual values:**
   - Open .env in any text editor
   - Replace pplx-your-api-key-here with your actual Perplexity API key
   - Update DATA_PATH to point to your Excel file
   - Update LOGO_PATH to point to your logo file (optional)

3. **Get your Perplexity API key:**
   - Go to https://www.perplexity.ai/settings/api
   - Sign up or log in
   - Generate a new API key
   - Copy the key and paste it in your .env file

4. **Run the application:**
   `ash
   python enhanced_fastapi.py
   `

## Required Variables

- PPLX_API_KEY1: Your Perplexity AI API key
- DATA_PATH: Path to your Excel data file

## Optional Variables

- LOGO_PATH: Path to your logo file
- HOST: Server host (default: 0.0.0.0)
- PORT: Server port (default: 8000)
- CORS_ORIGINS: Allowed frontend URLs
- LOG_LEVEL: Logging level (default: INFO)
- ENVIRONMENT: Environment type (default: development)
- DEBUG: Debug mode (default: True)

## File Structure

`
python_code/
 .env.example          # Template file (safe to commit)
 .env                  # Your actual config (DO NOT commit)
 enhanced_fastapi.py   # Main FastAPI application
 bot4.py              # Streamlit application
 fastap.py            # Basic FastAPI application
 ...other files
`

## Security Notes

- **NEVER** commit your .env file to version control
- Keep your API keys secure and private
- Use different API keys for development and production
- Regularly rotate your API keys

## Troubleshooting

If you get errors:
1. Check that your .env file exists and has the correct format
2. Verify your API key is valid and active
3. Make sure your data file path is correct
4. Check the log file for detailed error messages

## Support

For more help, check the main README.md file or contact support.
