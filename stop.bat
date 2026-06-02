@echo off
chcp 65001 >nul
title 停止 感應光寓 · B 區 TV
echo 停止顯示伺服器 (port 5274) ...

REM 用埠口找到 vite preview 的 PID 並關閉(不會誤殺其他程式)
set "KILLED="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5274" ^| findstr LISTENING') do (
  taskkill /PID %%P /F >nul 2>nul
  set "KILLED=1"
)
if defined KILLED ( echo 顯示伺服器已停止。) else ( echo 沒有偵測到執行中的伺服器。)

echo.
echo 若 Chrome 仍在全螢幕,請在該畫面按 Alt+F4 關閉。
echo ^(本檔不自動關 Chrome,以免關到你其他分頁。^)
timeout /t 3 >nul
exit /b 0
