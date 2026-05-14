@echo off
cd D:\bookbrain01\backend
call venv\Scripts\activate
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
pause
