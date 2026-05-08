from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import analyze, prompt, respond, health, quiz

app = FastAPI(title="BookBrain API", version="2.0.0", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(health.router,  tags=["Health"])
app.include_router(analyze.router, prefix="/analyze-book",    tags=["Analysis"])
app.include_router(prompt.router,  prefix="/generate-prompt", tags=["Prompts"])
app.include_router(respond.router, prefix="/respond",         tags=["Respond"])
app.include_router(quiz.router,    prefix="/generate-quiz",   tags=["Quiz"])

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc), "type": type(exc).__name__})
