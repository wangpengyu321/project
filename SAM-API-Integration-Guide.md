# SAM 智能分割 API 集成指南

本指南提供了关于如何将 Segment Anything Model (SAM) API 集成到医学眼科系统中的详细说明。

## 目录

1. [简介](#简介)
2. [准备工作](#准备工作)
3. [启动 SAM API 服务](#启动-sam-api-服务)
4. [后端集成](#后端集成)
5. [前端集成](#前端集成)
6. [测试](#测试)
7. [故障排除](#故障排除)

## 简介

SAM（Segment Anything Model）是一种先进的图像分割模型，能够根据用户的简单框选，实时生成精确的对象分割结果。在医学眼科系统中，SAM API 可以用于自动分割眼部图像中的各种结构，如视网膜、血管、病变区域等。

### 主要功能
- 根据用户框选区域智能分割图像中的对象
- 支持多种输入方式（点击、框选等）
- 返回高精度的分割掩码

## 准备工作

### 系统要求
- Python 3.9 或更高版本
- CUDA（推荐，但不是必需）
- 至少 8GB RAM
- 足够的磁盘空间（约 5GB 用于模型和环境）

### 目录结构
```
sam-service/
├── samapi/              # SAM API 源代码
├── samapi-env/          # Python 虚拟环境
├── models/              # 存放 SAM 模型文件
│   └── vit_b.pth        # SAM ViT-B 模型权重
├── start_sam_api.bat    # 启动脚本
└── README.md            # 说明文档
```

## 启动 SAM API 服务

### 使用启动脚本

我们提供了一个简单的批处理脚本 `start_sam_api.bat` 来启动 SAM API 服务：

1. 双击 `start_sam_api.bat` 文件
2. 脚本会自动激活 Python 环境并启动 SAM API 服务
3. 服务将在 http://127.0.0.1:9000 上运行
4. 当您看到 "Application startup complete" 消息时，服务已成功启动

### 手动启动

如果您需要手动启动服务：

1. 打开命令提示符或 PowerShell
2. 导航到 `sam-service` 目录
3. 执行以下命令：

```bash
cd sam-service
.\samapi-env\Scripts\activate
set PIL_MAX_IMAGE_PIXELS=
uvicorn samapi.app:app --host 127.0.0.1 --port 9000 --workers 2
```

## 后端集成

后端与 SAM API 的集成涉及创建一个路由来处理前端的分割请求，并将这些请求转发到 SAM API 服务。

### 创建 AI 路由器

在主系统的后端目录中，创建或修改 `ai.ts` 文件：

```typescript
// 导入必要的模块
import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// 创建路由器
const router = express.Router();

// SAM 分割 API 端点
router.post('/sam-segment', async (req, res) => {
  try {
    // 检查用户是否已登录
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    // 检查是否上传了图像
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: '未提供图像' });
    }

    const imageFile = req.files.image;
    const tempDir = path.join(__dirname, '..', 'temp');
    
    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 生成唯一的文件名
    const fileName = `${uuidv4()}-${imageFile.name}`;
    const filePath = path.join(tempDir, fileName);
    
    // 保存上传的图像
    await imageFile.mv(filePath);
    
    // 读取图像文件并转换为 Base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // 获取边界框信息
    let bbox = null;
    if (req.body.bbox) {
      bbox = JSON.parse(req.body.bbox);
    }
    
    // 构建请求体
    const requestBody = {
      image: base64Image,
      bbox: bbox
    };
    
    // 发送请求到 SAM API
    const samApiResponse = await axios.post('http://127.0.0.1:9000/segment', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 处理响应数据
    if (samApiResponse.status === 200) {
      // 清理临时文件
      fs.unlinkSync(filePath);
      
      // 返回分割结果
      return res.json({
        success: true,
        segments: samApiResponse.data.segments
      });
    } else {
      throw new Error('SAM API 返回错误');
    }
  } catch (error) {
    console.error('SAM 分割处理错误:', error);
    return res.status(500).json({
      success: false,
      message: '图像分割处理失败',
      error: error.message
    });
  }
});

export default router;
```

### 注册路由

在主应用的入口文件（如 `server.ts` 或 `app.ts`）中，注册 AI 路由器：

```typescript
import aiRouter from './routes/ai';

// 注册路由
app.use('/api/ai', aiRouter);
```

## 前端集成

前端集成涉及添加用户界面元素和逻辑，允许用户框选感兴趣的区域并发送分割请求。

### 在图像标注页面中集成

在 `ImageAnnotationPage.tsx` 中，添加以下代码：

```typescript
// 导入必要的钩子
import { useState, useRef } from 'react';

// 在组件中添加状态
const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
const [isSegmenting, setIsSegmenting] = useState(false);
const segmentationCanvasRef = useRef<HTMLCanvasElement>(null);

// 鼠标按下事件处理程序
const handleMouseDown = (e: React.MouseEvent) => {
  if (activeTab !== 'segment') return;
  
  const rect = canvasRef.current?.getBoundingClientRect();
  if (rect) {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
  }
};

// 鼠标移动事件处理程序
const handleMouseMove = (e: React.MouseEvent) => {
  if (activeTab !== 'segment' || !selectionBox) return;
  
  const rect = canvasRef.current?.getBoundingClientRect();
  if (rect) {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectionBox({ ...selectionBox, endX: x, endY: y });
    
    // 绘制选择框
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        const width = selectionBox.endX - selectionBox.startX;
        const height = selectionBox.endY - selectionBox.startY;
        ctx.strokeRect(selectionBox.startX, selectionBox.startY, width, height);
      }
    }
  }
};

// 鼠标释放事件处理程序
const handleMouseUp = () => {
  if (activeTab !== 'segment' || !selectionBox) return;
  endSelection();
};

// 框选区域结束时的处理函数
const endSelection = async () => {
  if (!selectionBox || activeTab !== 'segment' || !image) return;
  
  // 计算选择区域
  const width = Math.abs(selectionBox.endX - selectionBox.startX);
  const height = Math.abs(selectionBox.endY - selectionBox.startY);
  
  // 确保选择区域足够大
  if (width < 20 || height < 20) {
    setSelectionBox(null);
    return;
  }

  setIsSegmenting(true);
  
  try {
    // 从图像数据URL创建Blob
    const response = await fetch(image);
    const blob = await response.blob();
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', blob, 'image.png');
    
    // 添加选框信息
    const bbox = [
      Math.min(selectionBox.startX, selectionBox.endX),
      Math.min(selectionBox.startY, selectionBox.endY),
      Math.max(selectionBox.startX, selectionBox.endX),
      Math.max(selectionBox.startY, selectionBox.endY)
    ];
    formData.append('bbox', JSON.stringify(bbox));
    
    // 发送请求到后端
    const res = await fetch('/api/ai/sam-segment', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      throw new Error('分割请求失败');
    }
    
    const data = await res.json();
    
    if (data.success && data.segments && segmentationCanvasRef.current) {
      const segCtx = segmentationCanvasRef.current.getContext('2d');
      if (segCtx) {
        // 清除之前的分割结果
        segCtx.clearRect(0, 0, segmentationCanvasRef.current.width, segmentationCanvasRef.current.height);
        
        // 绘制SAM返回的分割结果
        data.segments.forEach(segment => {
          // 假设GeoJSON格式，解析坐标
          if (segment.geometry && segment.geometry.coordinates) {
            const coordinates = segment.geometry.coordinates[0]; // 外部轮廓
            
            segCtx.strokeStyle = selectedColor;
            segCtx.lineWidth = 3;
            segCtx.globalAlpha = 1.0;
            
            segCtx.beginPath();
            
            // 绘制轮廓
            if (coordinates.length > 0) {
              segCtx.moveTo(coordinates[0][0], coordinates[0][1]);
              for (let i = 1; i < coordinates.length; i++) {
                segCtx.lineTo(coordinates[i][0], coordinates[i][1]);
              }
              segCtx.closePath();
              segCtx.stroke();
              
              // 填充区域（低透明度）
              segCtx.fillStyle = selectedColor;
              segCtx.globalAlpha = opacity;
              segCtx.fill();
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('分割处理失败:', error);
    // 提示用户错误
  } finally {
    setIsSegmenting(false);
    setSelectionBox(null);
    
    // 清除临时选择框
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }
};

// 添加分割选项卡
// 在UI中添加一个新的分割选项卡
// <Tabs value={activeTab} onValueChange={setActiveTab}>
//   <TabsList>
//     <TabsTrigger value="draw">绘制</TabsTrigger>
//     <TabsTrigger value="erase">擦除</TabsTrigger>
//     <TabsTrigger value="segment">智能分割</TabsTrigger>
//   </TabsList>
// </Tabs>

// 添加加载状态指示器
// {isSegmenting && <Spinner />}

// 在画布层次结构中添加分割层
// <canvas
//   ref={segmentationCanvasRef}
//   width={imageWidth}
//   height={imageHeight}
//   className="absolute top-0 left-0 pointer-events-none z-20"
// />
```

## 测试

### 端到端测试流程

1. 启动 SAM API 服务：
   - 双击 `start_sam_api.bat`
   - 等待服务启动完成（"Application startup complete"）

2. 启动主系统：
   - 使用通常的程序启动方法

3. 测试智能分割功能：
   - 导航到图像标注页面
   - 加载眼部图像
   - 切换到"智能分割"选项卡
   - 框选感兴趣的区域
   - 确认分割结果正确显示

### API 测试

您可以使用 API 客户端（如 Postman）直接测试 SAM API：

```
POST http://127.0.0.1:9000/segment
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...", // 图像的Base64编码
  "bbox": [100, 100, 300, 300] // 可选的边界框 [x1, y1, x2, y2]
}
```

## 故障排除

### 常见问题

1. **SAM API 服务无法启动**
   - 检查 Python 环境是否正确设置
   - 确认所有依赖项已安装
   - 检查 `models` 目录中是否有模型文件

2. **分割请求超时**
   - 确认 SAM API 服务正在运行
   - 检查网络连接
   - 考虑增加超时设置

3. **分割结果不准确**
   - 尝试框选更明确的区域
   - 确保图像质量良好
   - 考虑使用更高级的 SAM 模型（如 ViT-H）

4. **网络错误**
   - 确认 SAM API 服务端口（9000）未被其他服务占用
   - 检查防火墙设置
   - 验证前后端服务设置的 URL 是否正确

### 日志检查

检查 SAM API 服务日志以获取更多信息：

- 控制台输出
- 系统日志（如果配置了日志记录）

## 结论

通过按照本指南操作，您应该能够将 SAM API 集成到医学眼科系统中，提供高精度的眼部图像分割功能。集成成功后，您的用户将能够使用智能分割功能来快速、准确地标注眼部图像中的各种结构。

如果您有任何问题或需要进一步的帮助，请参考 SAM 项目的官方文档或联系技术支持团队。 