# SAM API 启动脚本 (PowerShell版本)
# 解决编码和路径问题的增强版启动脚本

# 设置编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=====================================================`n" -ForegroundColor Cyan
Write-Host "            启动SAM API服务 (增强版)                 `n" -ForegroundColor Cyan
Write-Host "=====================================================`n" -ForegroundColor Cyan

# 切换到正确的目录
Write-Host "[步骤1] 切换到正确的目录..." -ForegroundColor Green
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\sam-service"

if (-not (Test-Path "samapi")) {
    Write-Host "错误：找不到samapi目录！" -ForegroundColor Red
    Write-Host "当前目录：$((Get-Location).Path)" -ForegroundColor Red
    Write-Host "`n按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 激活Python环境
Write-Host "`n[步骤2] 激活Python环境..." -ForegroundColor Green
if (-not (Test-Path "samapi-env\Scripts\Activate.ps1")) {
    Write-Host "错误：找不到Python环境激活脚本！" -ForegroundColor Red
    Write-Host "`n按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 在PowerShell中激活虚拟环境
& "$scriptPath\sam-service\samapi-env\Scripts\Activate.ps1"

# 设置环境变量
Write-Host "`n[步骤3] 设置环境变量..." -ForegroundColor Green
# 创建临时目录
if (-not (Test-Path "D:\temp")) {
    New-Item -Path "D:\temp" -ItemType Directory -Force | Out-Null
    Write-Host "创建临时目录：D:\temp" -ForegroundColor Yellow
}

# 创建缓存目录
if (-not (Test-Path "D:\pip_cache")) {
    New-Item -Path "D:\pip_cache" -ItemType Directory -Force | Out-Null
    Write-Host "创建PIP缓存目录：D:\pip_cache" -ForegroundColor Yellow
}

# 设置环境变量
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
$env:PIP_CACHE_DIR = "D:\pip_cache"
$env:PYTHONUSERBASE = "D:\python_user_base"
$env:PYTHONPATH = "$((Get-Location).Path)\samapi;$env:PYTHONPATH"
$env:PIL_MAX_IMAGE_PIXELS = ""
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"

# 检查CUDA状态
Write-Host "`n[步骤4] 检查CUDA状态..." -ForegroundColor Green
try {
    # 创建临时Python文件进行CUDA检查
    $tempPyFile = "D:\temp\check_cuda.py"
    
    @"
import torch
import sys
print('CUDA是否可用:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('CUDA设备数量:', torch.cuda.device_count())
    print('CUDA设备名称:', torch.cuda.get_device_name(0))
    print('可用GPU内存: {:.2f} GB'.format(torch.cuda.get_device_properties(0).total_memory/1024/1024/1024))
    sys.exit(0)
else:
    print('未检测到可用的CUDA设备，将使用CPU模式运行')
    sys.exit(1)
"@ | Out-File -FilePath $tempPyFile -Encoding UTF8
    
    # 执行Python脚本
    $cudaResult = python $tempPyFile
    Write-Host $cudaResult -ForegroundColor Yellow
    
    if ($LASTEXITCODE -eq 0) {
        $usingGPU = $true
        Write-Host "GPU检测成功，将使用GPU加速" -ForegroundColor Green
    } else {
        $usingGPU = $false
        Write-Host "未检测到GPU，将使用CPU模式" -ForegroundColor Yellow
    }
    
    # 删除临时文件
    if (Test-Path $tempPyFile) {
        Remove-Item $tempPyFile -Force
    }
} catch {
    $usingGPU = $false
    Write-Host "检查CUDA状态时出错: $_" -ForegroundColor Red
    Write-Host "将使用CPU模式继续" -ForegroundColor Yellow
}

# 安装必要的依赖包
Write-Host "`n[步骤5] 确保依赖包已安装..." -ForegroundColor Green
pip install fastapi uvicorn
pip install pillow numpy

# 启动SAM API服务
Write-Host "`n[步骤6] 启动SAM API服务..." -ForegroundColor Green
Write-Host "注意: 服务将在http://127.0.0.1:9000运行" -ForegroundColor Cyan
Set-Location "samapi"

if (-not (Test-Path "src\samapi\main.py")) {
    Write-Host "错误：找不到SAM API主程序文件！" -ForegroundColor Red
    Write-Host "`n按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "`n正在启动服务，首次启动可能需要加载模型文件..." -ForegroundColor Yellow
Write-Host "启动后请访问: http://127.0.0.1:9000/docs 查看API文档" -ForegroundColor Green
Write-Host "`n按Ctrl+C可以停止服务" -ForegroundColor Cyan

# 启动服务，根据GPU状态选择配置
if ($usingGPU) {
    python -m uvicorn src.samapi.main:app --host 127.0.0.1 --port 9000
} else {
    # CPU模式，减少workers数量
    python -m uvicorn src.samapi.main:app --host 127.0.0.1 --port 9000 --workers 1
}

# 如果服务启动失败，显示错误信息
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n启动SAM API服务失败！" -ForegroundColor Red
    Write-Host "请检查上面的错误信息" -ForegroundColor Red
}

Write-Host "`n按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 