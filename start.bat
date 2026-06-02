@echo off
chcp 65001 >nul
title 感應光寓 · B 區 TV 顯示
cd /d "%~dp0"

echo ============================================
echo   感應光寓 · B 區 TV 主顯示
echo ============================================
echo.

REM ── 檢查 Node.js ───────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 Node.js。
  echo 請先到 https://nodejs.org/ 下載安裝 LTS 版,
  echo 安裝完成後,重新點兩下這個 start.bat 即可。
  echo.
  pause
  exit /b 1
)

REM ── 第一次執行:安裝套件 ───────────────────────────────────────
if not exist node_modules (
  echo [1/3] 第一次執行,正在安裝套件^(需要網路,約 1-2 分鐘^)...
  call npm install
  if errorlevel 1 ( echo [錯誤] 套件安裝失敗,請檢查網路後重試。 & pause & exit /b 1 )
) else (
  echo [1/3] 套件已安裝,略過。
)

REM ── 建置 ───────────────────────────────────────────────────────
echo [2/3] 建置中...
call npm run build
if errorlevel 1 ( echo [錯誤] 建置失敗。 & pause & exit /b 1 )

REM ── 啟動顯示伺服器(背景最小化視窗)────────────────────────────
echo [3/3] 啟動顯示伺服器 http://localhost:5274 ...
start "感應光寓-TV-server" /min cmd /c "npm run preview"

echo 等待伺服器就緒...
timeout /t 4 /nobreak >nul

REM ── 用 Chrome 全螢幕 kiosk 開啟(找不到就用預設瀏覽器)──────────
set "CHROME="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do if exist %%~P set "CHROME=%%~P"

if defined CHROME (
  start "" "%CHROME%" --kiosk --autoplay-policy=no-user-gesture-required --disable-features=Translate http://localhost:5274
) else (
  echo 找不到 Chrome,改用預設瀏覽器開啟^(非全螢幕^)。
  start "" http://localhost:5274
)

echo.
echo ============================================
echo  已開啟!Chrome 全螢幕中,按 Alt+F4 可關閉。
echo  要完全結束請執行 stop.bat。
echo ============================================
timeout /t 5 >nul
exit /b 0
