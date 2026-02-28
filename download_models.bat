@echo off
setlocal enabledelayedexpansion
title SilkDream - Model Downloader
color 0D

echo.
echo  ========================================
echo    SilkDream - Downloading Models
echo    Juggernaut XL v9 (realistic images)
echo    epiCRealism (fast SD1.5 model)
echo  ========================================
echo.

:: Auto-read Civitai API key from api_keys.txt
set CIVITAI_KEY=
for /f "tokens=2 delims==" %%A in ('findstr /i "CIVITAI_API_KEY" "%~dp0api_keys.txt"') do set CIVITAI_KEY=%%A

if "!CIVITAI_KEY!"=="" (
    echo  [ERROR] Civitai API key not found in api_keys.txt
    echo  Add it as: CIVITAI_API_KEY=your_key_here
    pause
    exit /b 1
)

echo  [OK] Civitai API key loaded from api_keys.txt

echo.
echo  Downloading Juggernaut XL v9...
echo  (This is ~6GB - may take 10-30 minutes)
echo.

:: Juggernaut XL v9 - model version ID 782002
powershell -Command "Invoke-WebRequest -Uri 'https://civitai.com/api/download/models/782002?token=!CIVITAI_KEY!' -OutFile 'D:\stable-diffusion-webui\models\Stable-diffusion\JuggernautXL_v9.safetensors' -UseBasicParsing"

if !errorlevel! equ 0 (
    echo  [OK] Juggernaut XL v9 downloaded!
) else (
    echo  [WARN] Download failed. Check your API key.
)

echo.
echo  Downloading epiCRealism Natural Sin (SD1.5)...
echo  (This is ~2GB)
echo.

:: epiCRealism Natural Sin RC1 VAE - model version ID 134065
powershell -Command "Invoke-WebRequest -Uri 'https://civitai.com/api/download/models/134065?token=!CIVITAI_KEY!' -OutFile 'D:\stable-diffusion-webui\models\Stable-diffusion\epiCRealism.safetensors' -UseBasicParsing"

if !errorlevel! equ 0 (
    echo  [OK] epiCRealism downloaded!
) else (
    echo  [WARN] epiCRealism download failed.
)

echo.
echo  ========================================
echo    Model downloads complete!
echo    Start A1111 with: webui-user.bat
echo  ========================================
pause
