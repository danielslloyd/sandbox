@echo off
setlocal enabledelayedexpansion

REM LLM Quiz Generator - Auto Startup Script (Windows)
REM This script handles everything needed to run the quiz generator

title LLM Quiz Generator - Starting...

echo.
echo ========================================================
echo          LLM Quiz Generator - Auto Startup
echo ========================================================
echo.

REM Step 1: Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found
echo.

REM Step 2: Install dependencies if needed
echo [2/5] Checking dependencies...
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Step 3: Check .env file
echo [3/5] Checking configuration...
if not exist ".env" (
    echo [WARN] No .env file found. Creating from template...
    copy .env.example .env >nul
    echo [OK] Created .env file
    echo      You can add API keys to .env for cloud models
) else (
    echo [OK] Configuration file exists
)
echo.

REM Step 4: Check and start Ollama
echo [4/5] Checking Ollama (local models)...
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Ollama not installed (local models will not work)
    echo        To use local models, install from: https://ollama.com/download
    echo        (You can still use cloud models)
) else (
    echo [OK] Ollama found

    REM Check if Ollama is running
    curl -s http://localhost:11434/api/tags >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Ollama is already running
    ) else (
        echo Starting Ollama server...
        start /B ollama serve

        REM Wait for Ollama to start
        echo Waiting for Ollama to start...
        timeout /t 3 /nobreak >nul

        curl -s http://localhost:11434/api/tags >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo [OK] Ollama started successfully
        ) else (
            echo [WARN] Could not auto-start Ollama
            echo        Run 'ollama serve' manually for local models
        )
    )
)
echo.

REM Step 5: Start the server
echo [5/5] Starting Quiz Generator server...
echo.
echo ========================================================
echo  Server starting on http://localhost:3000
echo ========================================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Auto-open browser
timeout /t 2 /nobreak >nul
start http://localhost:3000

REM Start the Node.js server
title LLM Quiz Generator - Running
call npm start
