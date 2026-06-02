@echo off
chcp 65001 >nul
title 感應光寓 · B 區 NFC 伺服器 (8788)
cd /d "%~dp0"

REM 看畫面不需要這個;只有要用「真實讀卡機 / 桌面與電視同步」時才需要。
REM NFC 伺服器 (Python) 在隔壁 b-livingroom 專案,不在本 repo。這支會去找它。

where python >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 Python。請先到 https://www.python.org/ 安裝,
  echo 並在 cmd 執行: pip install pyscard websockets
  pause & exit /b 1
)

set "SRV="
for %%D in (
  "%~dp0..\b-livingroom\server\server.py"
  "%~dp0..\b-livingroom\server\server.py"
) do if exist %%~D set "SRV=%%~D"

if not defined SRV (
  echo [找不到 NFC 伺服器] 預期位置: ..\b-livingroom\server\server.py
  echo 請確認 b-livingroom 專案和本資料夾放在同一層,
  echo 或手動執行: python 你的路徑\server.py
  pause & exit /b 1
)

echo 啟動 NFC 伺服器: %SRV%
echo ^(埠口 8788;接上 ACR122U 讀卡機後會自動廣播刷卡事件給電視與桌面^)
python "%SRV%"
pause
