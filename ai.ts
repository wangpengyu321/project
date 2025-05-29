/**
 * SAM API 集成服务
 * 处理与SAM (Segment Anything Model) API的通信
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fileUpload from 'express-fileupload';
import { logger } from '../utils/logger';

// 创建路由器
const router = express.Router();

// 中间件：检查SAM API服务是否可用
const checkSamApiAvailable = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const response = await axios.get('http://127.0.0.1:9000/health', {
      timeout: 2000
    });
    
    if (response.status === 200) {
      next();
    } else {
      return res.status(503).json({
        success: false,
        message: 'SAM API服务不可用',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
  } catch (error) {
    logger.error('SAM API健康检查失败', error);
    return res.status(503).json({
      success: false,
      message: 'SAM API服务不可用',
      error: 'SERVICE_UNAVAILABLE'
    });
  }
};

// 模型类型枚举
enum SamModelType {
  ORIGINAL = 'original',
  MOBILE = 'mobile'
}

// 获取SAM API服务状态
router.get('/sam-status', async (req, res) => {
  try {
    const response = await axios.get('http://127.0.0.1:9000/health', {
      timeout: 2000
    }).catch(() => null);
    
    if (response && response.status === 200) {
      return res.json({
        success: true,
        status: 'available',
        model: response.data.model || SamModelType.ORIGINAL
      });
    } else {
      return res.json({
        success: true,
        status: 'unavailable'
      });
    }
  } catch (error) {
    logger.error('获取SAM API状态失败', error);
    return res.json({
      success: true,
      status: 'unavailable',
      error: error.message
    });
  }
});

// SAM 分割 API 端点
router.post('/sam-segment', checkSamApiAvailable, async (req: express.Request, res: express.Response) => {
  try {
    // 检查用户是否已登录
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    // 检查是否上传了图像
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: '未提供图像' });
    }

    const imageFile = req.files.image as fileUpload.UploadedFile;
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
    const base64Image = `data:${imageFile.mimetype};base64,${imageBuffer.toString('base64')}`;
    
    // 获取边界框信息
    let bbox = null;
    if (req.body.bbox) {
      bbox = JSON.parse(req.body.bbox);
    }
    
    // 获取模型类型（如果提供）
    const modelType = req.body.model || SamModelType.ORIGINAL;
    
    // 构建请求体
    const requestBody = {
      image: base64Image,
      bbox: bbox,
      model: modelType
    };
    
    // 请求选项
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    };
    
    // 发送请求到 SAM API
    logger.info('正在发送分割请求到SAM API');
    const samApiResponse = await axios.post('http://127.0.0.1:9000/segment', requestBody, requestOptions);
    
    // 处理响应数据
    if (samApiResponse.status === 200) {
      // 清理临时文件
      fs.unlinkSync(filePath);
      
      // 返回分割结果
      return res.json({
        success: true,
        segments: samApiResponse.data.segments,
        processingTime: samApiResponse.data.processing_time
      });
    } else {
      throw new Error('SAM API 返回错误');
    }
  } catch (error) {
    logger.error('SAM 分割处理错误:', error);
    return res.status(500).json({
      success: false,
      message: '图像分割处理失败',
      error: error.message
    });
  }
});

// 获取SAM模型信息
router.get('/sam-models', checkSamApiAvailable, async (req, res) => {
  try {
    const response = await axios.get('http://127.0.0.1:9000/models', {
      timeout: 5000
    });
    
    if (response.status === 200) {
      return res.json({
        success: true,
        models: response.data.models
      });
    } else {
      throw new Error('获取模型信息失败');
    }
  } catch (error) {
    logger.error('获取SAM模型信息失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取模型信息失败',
      error: error.message
    });
  }
});

export default router; 