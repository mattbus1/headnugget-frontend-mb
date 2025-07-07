from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database_fallback import init_database, close_database, is_using_memory_db
from .api import auth, entities, documents, dashboard, analytics


# Database client variable
db_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    global db_client
    
    # Startup
    print("🚀 Starting Headnugget Backend (PolicyStack Integration)")
    print(f"🔧 Environment: {'Development' if settings.DEBUG else 'Production'}")
    
    # Initialize database (with fallback)
    print("📊 Initializing database connection...")
    db_client = await init_database()
    
    if is_using_memory_db():
        print("🧠 Using in-memory database for development")
    else:
        print("✅ MongoDB connected successfully")
    
    print(f"🌐 CORS enabled for origins: {settings.cors_origins_list}")
    print(f"🔐 JWT expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"📝 Registration {'enabled' if settings.ALLOW_REGISTRATION else 'disabled'}")
    print("🎯 Backend ready for frontend integration!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down backend...")
    if db_client:
        await close_database(db_client)
    print("✅ Database connection closed")


# Create FastAPI application
app = FastAPI(
    title="Headnugget Backend",
    description="PolicyStack Integration API for Insurance Document Processing",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(entities.router)
app.include_router(documents.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Headnugget Backend API",
        "version": "2.0.0",
        "description": "PolicyStack Integration for Insurance Document Processing",
        "docs": "/docs",
        "health": "/health",
        "phase_1": "✅ Authentication System",
        "phase_2": "✅ Document Management",
        "phase_3": "✅ Real-time Processing Status",
        "phase_4": "✅ Entity-based Organization",
        "phase_5": "✅ Analytics and Visualization"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "database": "in-memory" if is_using_memory_db() else ("connected" if db_client else "disconnected"),
        "version": "2.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )