"""
Headnugget Backend Startup Script
PolicyStack Integration for Insurance Document Processing
"""
import uvicorn
from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    print("🚀 Starting Headnugget Backend Server")
    print(f"🌐 Running on: http://localhost:8000")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔧 Environment: {'Development' if settings.DEBUG else 'Production'}")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )