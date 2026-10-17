@echo off
chcp 65001 > nul
echo ========================================================
echo   DMX CashBack — Publicador Automatico para GitHub
echo ========================================================
echo.
echo Enviando pastas css/, js/ e arquivos atualizados para o GitHub...
echo.

set "GIT_EXE=C:\Users\Sophia\AppData\Local\GitHubDesktop\app-3.5.6\resources\app\git\cmd\git.exe"

if exist "%GIT_EXE%" (
    "%GIT_EXE%" add -A
    "%GIT_EXE%" commit -m "Sincronizar pastas css, js e configuracoes do GitHub Pages" > nul 2>&1
    "%GIT_EXE%" push origin main
) else (
    git add -A
    git commit -m "Sincronizar pastas css, js e configuracoes do GitHub Pages" > nul 2>&1
    git push origin main
)

echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo [SUCESSO] Arquivos e pastas enviados com sucesso para o GitHub!
    echo Aguarde cerca de 60 segundos e recarregue a pagina no navegador (Ctrl + Shift + R).
) else (
    echo [AVISO] Ocorreu uma solicitacao de autenticacao ou erro no envio.
    echo Se abrir uma janela do navegador ou do GitHub, autorize o login.
    echo Voce tambem pode abrir o GitHub Desktop e clicar em 'Push origin'.
)
echo ========================================================
echo.
pause
