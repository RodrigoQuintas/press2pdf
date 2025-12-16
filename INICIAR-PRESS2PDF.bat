@echo off
chcp 65001 > nul
title Press2PDF - Iniciando...

echo.
echo ========================================
echo      🚀 PRESS2PDF - INICIANDO
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js encontrado: 
node --version
echo.

REM Verificar se as dependências estão instaladas
if not exist "node_modules\" (
    echo 📦 Instalando dependências pela primeira vez...
    echo Isso pode levar alguns minutos...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

if not exist "frontend\node_modules\" (
    echo 📦 Instalando dependências do frontend...
    echo.
    call npm install --workspace frontend
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro ao instalar dependências do frontend!
        pause
        exit /b 1
    )
)

if not exist "server\node_modules\" (
    echo 📦 Instalando dependências do servidor...
    echo.
    call npm install --workspace server
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Erro ao instalar dependências do servidor!
        pause
        exit /b 1
    )
)

REM Verificar se Playwright está instalado
if not exist "server\node_modules\playwright\.local-browsers\chromium-*" (
    echo 📥 Instalando navegador Chromium (Playwright)...
    echo Isso pode levar alguns minutos na primeira execução...
    echo.
    call npm run playwright:install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ⚠️ Aviso: Erro ao instalar Playwright, mas continuando...
    )
)

echo.
echo ========================================
echo      ✓ PRONTO! INICIANDO APLICAÇÃO
echo ========================================
echo.
echo 🌐 O navegador abrirá automaticamente
echo 📍 URL: http://localhost:5173
echo.
echo ⚠️  IMPORTANTE:
echo    NÃO FECHE ESTA JANELA!
echo    Para parar a aplicação, pressione Ctrl+C
echo    ou feche esta janela.
echo.
echo ========================================
echo.

REM Aguardar 3 segundos antes de abrir o navegador
timeout /t 3 /nobreak >nul

REM Abrir o navegador em segundo plano
start "" http://localhost:5173

REM Iniciar a aplicação (servidor e frontend)
title Press2PDF - Executando
call npm run start
