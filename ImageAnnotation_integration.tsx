// ImageAnnotationPage.tsx 中与SAM API集成的相关代码

// 在组件中添加必要的状态：
// const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
// const [isSegmenting, setIsSegmenting] = useState(false);
// const segmentationCanvasRef = useRef<HTMLCanvasElement>(null);

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
        
        // 添加分割图层（假设有一个addLayer函数）
        addLayer('segmentation');
      }
    }
  } catch (error) {
    console.error('分割处理失败:', error);
    // 可以添加错误提示给用户
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