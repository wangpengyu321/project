// ai.ts 集成SAM API的示例代码
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const SAM_API_URL = 'http://127.0.0.1:9000'; // SAM API服务地址

// SAM图像分割接口
router.post('/sam-segment', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '未登录' });
  }

  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: '未上传图片' });
  }

  try {
    const image = req.files.image;
    const { bbox } = req.body; // 前端发送的框选区域
    
    // 保存上传的图像到临时文件
    const tempDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const imagePath = path.join(tempDir, `${uuidv4()}_${image.name}`);
    await fs.promises.writeFile(imagePath, image.data);
    
    // 准备发送到SAM API的数据
    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    
    // 调用SAM API进行分割
    const response = await axios.post(`${SAM_API_URL}/sam/`, {
      type: 'vit_h', // 可以从请求参数获取或使用默认值
      b64img: imageBase64,
      bbox: bbox ? JSON.parse(bbox) : [0, 0, 0, 0],
    });
    
    // 清理临时文件
    fs.unlinkSync(imagePath);
    
    // 返回SAM的分割结果
    res.json({ 
      success: true, 
      segments: response.data
    });
    
  } catch (error) {
    console.error('图像分割失败:', error);
    res.status(500).json({ error: '图像分割失败，请稍后重试' });
  }
});

export default router; 