@echo off
chcp 65001 >nul
REM Set UTF-8 encoding

echo Running Anthropic API test...
echo.

node test-anthropic-api.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Test failed with error code: %ERRORLEVEL%
)

pause
