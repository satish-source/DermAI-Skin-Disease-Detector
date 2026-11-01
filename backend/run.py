import uvicorn
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting DermAI API Backend on http://localhost:{port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

