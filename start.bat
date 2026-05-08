@echo off
title BookBrain — Student Edition
color 0E
echo.
echo  =========================================
echo   BookBrain — AI Study Tool
echo   Student Edition — Free AI
echo  =========================================
echo.

python --version >nul 2>&1 || (echo Python not found. Install from python.org & pause & exit /b 1)
node --version   >nul 2>&1 || (echo Node.js not found. Install from nodejs.org & pause & exit /b 1)
echo [OK] Python and Node.js found

cd backend
if not exist ".env" (
  copy .env.example .env >nul
  echo [!] Created backend\.env
  echo [!] Open it and set: AI_PROVIDER=ollama (or groq)
  notepad .env
)
if not exist "venv" ( python -m venv venv )
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
cd ..

cd frontend
call npm install --silent
cd ..

echo.
echo  Starting services...
echo  App:   http://localhost:3000
echo  API:   http://localhost:8000
echo  Docs:  http://localhost:8000/docs
echo.

start "BookBrain Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "BookBrain Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo [OK] BookBrain is running! Check your browser.
pause
