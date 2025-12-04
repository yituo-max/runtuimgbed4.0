@echo off
echo === 部署到Vercel ===

REM 检查是否已登录Vercel CLI
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 请先登录Vercel CLI: vercel login
    exit /b 1
)

REM 部署到Vercel
echo 开始部署...
vercel --prod

echo 部署完成！
echo 请检查以下内容：
echo 1. API路由是否正常工作
echo 2. 静态资源是否正确加载
echo 3. 环境变量是否正确配置
pause