@echo off
chcp 65001 > nul
title Press2PDF

echo.
echo ========================================
echo      🚀 PRESS2PDF - INICIANDO
echo ========================================
echo.
echo 🌐 Abrindo aplicação...
echo 📍 URL: http://localhost:5173
echo.
echo ⚠️  Para parar: feche esta janela ou Ctrl+C
echo.
echo ========================================
echo.

REM Aguardar 3 segundos antes de abrir o navegador
timeout /t 3 /nobreak >nul

REM Abrir o navegador
start "" http://localhost:5173

REM Iniciar a aplicação
call npm start

REM Se chegou aqui, verificar se houve erro
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo      ❌ ERRO AO INICIAR APLICAÇÃO
    echo ========================================
    echo.
    echo Código de erro: %ERRORLEVEL%
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b %ERRORLEVEL%
)

echo.
echo Aplicação encerrada normalmente.
echo Pressione qualquer tecla para fechar...
pause >nul
