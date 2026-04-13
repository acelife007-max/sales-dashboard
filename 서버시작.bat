@echo off
chcp 65001 > nul
echo.
echo ====================================
echo   영업IQ 프록시 서버 시작 중...
echo ====================================
echo.

:: Node.js 설치 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo.
  echo https://nodejs.org 에서 Node.js를 설치해주세요.
  echo (LTS 버전 권장)
  echo.
  pause
  exit /b 1
)

echo Node.js 버전:
node -v
echo.
echo 서버 시작 중... 잠시만 기다려주세요.
echo.
echo 시작 후 브라우저에서 아래 주소로 접속하세요:
echo   http://localhost:3000
echo.
echo 종료하려면 이 창을 닫거나 Ctrl+C 를 누르세요.
echo.

node "%~dp0server.js"

pause
