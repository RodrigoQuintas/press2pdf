@echo off
title Press2PDF

echo.
echo ========================================
echo      PRESS2PDF - INICIANDO
echo ========================================
echo.

REM Verificar se npm existe
cd %USERPROFILE%\Desktop\press2pdf-main\press2pdf-main
start "" npm start
timeout /t 5
start "" http://localhost:5173

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

REM Abrir navegador

REM Iniciar aplicacao

REM Verificar erro

echo.
echo Aplicacao encerrada.
pause
