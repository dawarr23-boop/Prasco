@echo off
REM Quick deployment script for Raspberry Pi (Windows)
REM Usage: deploy-quick.bat

echo.
echo ===========================================
echo   PRASCO Quick Deployment to Raspberry Pi
echo ===========================================
echo.

REM Configuration
set PI_HOST=pi@192.168.2.47
set PI_PATH=/home/pi/prasco

echo Target: %PI_HOST%:%PI_PATH%
echo.

REM Step 1: Build
echo [1/4] Building for Raspberry Pi...
call npm run build:pi

if errorlevel 1 (
    echo.
    echo Build failed!
    pause
    exit /b 1
)

echo Done!
echo.

REM Step 2: Copy environment
echo [2/4] Copying environment configuration...
scp .env.pi %PI_HOST%:%PI_PATH%/.env

echo Done!
echo.

REM Step 3: Deploy files
echo [3/4] Deploying application files...
echo    - dist/
scp -r dist %PI_HOST%:%PI_PATH%/

echo    - css/
scp css/admin.css css/display.css %PI_HOST%:%PI_PATH%/css/

echo    - js/
scp js/admin.js js/display.js %PI_HOST%:%PI_PATH%/js/

echo    - views/
scp -r views %PI_HOST%:%PI_PATH%/

echo Done!
echo.

REM Step 4: Restart service
echo [4/4] Restarting PM2 service...
ssh %PI_HOST% "cd %PI_PATH% && pm2 restart prasco"

if errorlevel 1 (
    echo.
    echo Service restart failed!
    pause
    exit /b 1
)

echo.
echo ===========================================
echo   Deployment Complete!
echo ===========================================
echo.
echo View logs:    ssh %PI_HOST% "pm2 logs prasco"
echo Monitor:      ssh %PI_HOST% "pm2 monit"
echo SSH to Pi:    ssh %PI_HOST%
echo.
pause
