@echo off
title SilkDream
color 0D

echo.
echo  ========================================
echo    SilkDream - Local AI Generation Studio
echo    Starting server...
echo  ========================================
echo.
echo  Make sure Automatic1111 is running with:
echo  --api --xformers --medvram --listen
echo.

:: Open browser after 2 seconds
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Start the Node server
node server.js

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Failed to start. Did you run install.bat first?
    pause
)
