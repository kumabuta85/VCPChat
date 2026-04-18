@echo off
chcp 65001 >nul
echo ========================================
echo   LocalMusicSearch 更新工具
echo ========================================
echo.

cd /d "%~dp0"

echo [步骤 1/2] 生成音乐索引...
echo.
node generate_index.js
if errorlevel 1 (
    echo.
    echo ❌ 索引生成失败！
    echo.
    pause
    exit /b 1
)

echo.
echo [步骤 2/2] 增强标签信息...
echo.
node enhance_tags.js
if errorlevel 1 (
    echo.
    echo ❌ 标签增强失败！
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 完成！
echo 输出文件：output\music_index.json
echo ========================================
echo.
pause
