"""Entry point — loads .env and starts FastAPI.

Run with: uv run python run.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=False)
