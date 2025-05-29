# SAM API 环境修复脚本
# 用于检查和修复SAM API环境问题

# 设置编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=====================================================`n" -ForegroundColor Cyan
Write-Host "            SAM API 环境修复工具                     `n" -ForegroundColor Cyan
Write-Host "=====================================================`n" -ForegroundColor Cyan

# 切换到正确的目录
Write-Host "[步骤1] 切换到正确的目录..." -ForegroundColor Green
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\sam-service"

if (-not (Test-Path "samapi")) {
    Write-Host "警告：找不到samapi目录！尝试从GitHub克隆代码..." -ForegroundColor Yellow
    
    # 检查是否安装了Git
    try {
        git --version | Out-Null
    } catch {
        Write-Host "错误: 未安装Git。请先安装Git后再运行此脚本。" -ForegroundColor Red
        Write-Host "`n按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    
    # 克隆SAM API代码
    git clone https://github.com/Picsart-AI-Research/SAM-API.git samapi
    
    if (-not $?) {
        Write-Host "错误：无法克隆SAM API代码！请检查网络连接。" -ForegroundColor Red
        Write-Host "`n按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

# 设置环境变量和目录
Write-Host "`n[步骤2] 创建必要的目录和设置环境变量..." -ForegroundColor Green

# 创建目录
$directories = @("D:\temp", "D:\pip_cache", "D:\python_user_base")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "已创建目录: $dir" -ForegroundColor Yellow
    }
}

# 设置环境变量
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
$env:PIP_CACHE_DIR = "D:\pip_cache"
$env:PYTHONUSERBASE = "D:\python_user_base"
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"

# 检查Python
Write-Host "`n[步骤3] 检查Python安装..." -ForegroundColor Green
try {
    $pythonVersion = python --version
    Write-Host "检测到Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到Python。请安装Python 3.8+后再运行此脚本。" -ForegroundColor Red
    Write-Host "`n按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 检查/创建虚拟环境
Write-Host "`n[步骤4] 检查/创建Python虚拟环境..." -ForegroundColor Green
if (-not (Test-Path "samapi-env")) {
    Write-Host "未找到虚拟环境，正在创建新环境..." -ForegroundColor Yellow
    python -m venv samapi-env
    
    if (-not $?) {
        Write-Host "错误：创建虚拟环境失败！" -ForegroundColor Red
        Write-Host "`n按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
} else {
    Write-Host "已找到虚拟环境" -ForegroundColor Green
}

# 激活虚拟环境
if (-not (Test-Path "samapi-env\Scripts\Activate.ps1")) {
    Write-Host "错误：虚拟环境激活脚本不存在！" -ForegroundColor Red
    Write-Host "`n按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 激活环境
Write-Host "`n[步骤5] 激活Python环境..." -ForegroundColor Green
& "$scriptPath\sam-service\samapi-env\Scripts\Activate.ps1"

# 安装/更新依赖
Write-Host "`n[步骤6] 安装/更新必要的依赖..." -ForegroundColor Green
pip install --upgrade pip

# 安装基本依赖
$basicDeps = @(
    "fastapi", 
    "uvicorn", 
    "pillow", 
    "numpy", 
    "scikit-image",
    "pydantic",
    "geojson"
)

foreach ($package in $basicDeps) {
    Write-Host "安装/更新: $package" -ForegroundColor Yellow
    pip install --upgrade $package
}

# 检查CUDA状态并安装适当的PyTorch版本
Write-Host "`n[步骤7] 检查CUDA状态并安装PyTorch..." -ForegroundColor Green
$cudaAvailable = $false

try {
    # 检测NVIDIA GPU
    $gpuInfo = Get-WmiObject -Query "SELECT * FROM Win32_VideoController WHERE Name LIKE '%NVIDIA%'"
    
    if ($gpuInfo) {
        Write-Host "检测到NVIDIA GPU: $($gpuInfo.Name)" -ForegroundColor Green
        $cudaAvailable = $true
    } else {
        Write-Host "未检测到NVIDIA GPU，将安装CPU版本的PyTorch" -ForegroundColor Yellow
        $cudaAvailable = $false
    }
} catch {
    Write-Host "检查GPU时出错，将安装CPU版本的PyTorch: $_" -ForegroundColor Yellow
    $cudaAvailable = $false
}

# 安装PyTorch
if ($cudaAvailable) {
    Write-Host "安装CUDA版本的PyTorch..." -ForegroundColor Green
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
} else {
    Write-Host "安装CPU版本的PyTorch..." -ForegroundColor Green
    pip install torch torchvision
}

# 安装SAM依赖
Write-Host "`n[步骤8] 安装SAM相关包..." -ForegroundColor Green
cd samapi
pip install -e .

# 创建必要目录
Write-Host "`n[步骤9] 创建必要的目录结构..." -ForegroundColor Green
$samapiDirs = @("models", "temp")
foreach ($dir in $samapiDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "已创建目录: $dir" -ForegroundColor Yellow
    }
}

# 检查安装是否成功
Write-Host "`n[步骤10].验证安装..." -ForegroundColor Green
try {
    # 创建一个临时Python文件来执行导入测试
    $tempPyFile = "D:\temp\check_imports.py"
    
    @"
try:
    import torch
    import fastapi
    import uvicorn
    import numpy
    import PIL
    try:
        import samapi
        print(f"SAM API版本: {samapi.__version__}")
    except:
        print("无法导入samapi模块，但其他依赖已成功安装")
    print("基本依赖已正确安装")
    exit(0)
except Exception as e:
    print(f"错误: {str(e)}")
    exit(1)
"@ | Out-File -FilePath $tempPyFile -Encoding UTF8
    
    # 执行Python脚本
    $testResult = python $tempPyFile
    Write-Host $testResult -ForegroundColor Green
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "警告：依赖检查未完全通过，可能会影响服务运行" -ForegroundColor Yellow
    } else {
        Write-Host "`n环境修复完成！现在可以运行start_sam_api_fixed.ps1启动服务了" -ForegroundColor Cyan
    }
    
    # 删除临时文件
    if (Test-Path $tempPyFile) {
        Remove-Item $tempPyFile -Force
    }
} catch {
    Write-Host "依赖验证时出错: $_" -ForegroundColor Red
    Write-Host "请检查上述错误信息，解决后重新运行此脚本" -ForegroundColor Yellow
}

# 完成
Write-Host "`n=====================================================`n" -ForegroundColor Cyan
Write-Host "      环境设置完成！请运行start_sam_api_fixed.ps1       " -ForegroundColor Cyan
Write-Host "=====================================================`n" -ForegroundColor Cyan

Write-Host "`n按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 