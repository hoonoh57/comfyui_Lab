@echo off
chcp 65001 >nul
title ComfyUI Media Lab Server

echo ============================================
echo   ComfyUI Media Generation Lab - Server
echo   RTX 4070 8GB VRAM Optimized
echo ============================================
echo.

set COMFYUI_PATH=E:\ComfyUI_New\ComfyUI
set PYTHON_PATH=E:\ComfyUI_New\python_embeded\python.exe

REM Check if ComfyUI is already running
netstat -ano | findstr ":8188" >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] ComfyUI is already running on port 8188.
    echo [INFO] Open index.html in your browser to connect.
    pause
    exit /b 0
)

echo [INFO] Starting ComfyUI server...
cd /d %COMFYUI_PATH%

%PYTHON_PATH% main.py ^
    --lowvram ^
    --force-fp16 ^
    --listen 0.0.0.0 ^
    --port 8188 ^
    --enable-cors-header "*" ^
    --use-pytorch-cross-attention

pause
