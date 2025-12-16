@echo off
title Press2PDF

echo.
echo ========================================
echo      PRESS2PDF - INICIANDO
echo ========================================
echo.

REM Verificar se npm existe
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: npm nao encontrado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org/
    echo.
    echo Apos instalar, reinicie o computador.
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b 1
)

echo Node.js encontrado!
echo.
echo Abrindo aplicacao...
echo URL: http://localhost:5173
echo.
echo Para parar: feche esta janela ou Ctrl+C
echo.
echo ========================================
echo.

REM Aguardar 3 segundos
timeout /t 3 /nobreak >nul

REM Abrir navegador
start http://localhost:5173

REM Iniciar aplicacao
npm start

REM Verificar erro
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo      ERRO AO INICIAR
    echo ========================================
    echo.
    echo Codigo de erro: %ERRORLEVEL%
    echo.
    echo Pressione qualquer tecla para fechar...
    pause >nul
    exit /b %ERRORLEVEL%
)

echo.
echo Aplicacao encerrada.
pause
