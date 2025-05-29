 import React, { useState, useRef } from 'react';
import { Upload, X, Camera, RefreshCw, RotateCw, ZoomIn, DownloadCloud, Sliders, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 静态眼球模型组件
const StaticEyeballModel = ({ modelUrl, rotation, zoom }: { modelUrl: string, rotation: number, zoom: number }) => {
  return (
    <div className="flex flex-col items-center justify-center relative" 
         style={{ 
           transform: `scale(${zoom}) rotate(${rotation}deg)`,
           transition: 'transform 0.3s ease-in-out'
         }}>
      <div className="text-center text-blue-500 mb-4">
        <Eye className="w-32 h-32 mx-auto" />
        <p className="text-sm mt-2">3D模型预览 (静态替代版)</p>
      </div>
      <div className="text-gray-500 text-xs">
        模型URL: {modelUrl}
      </div>
    </div>
  );
};

// 主页面组件
export default function Eye3DModelPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [modelGenerated, setModelGenerated] = useState(false);
  const [modelUrl, setModelUrl] = useState('');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState('upload');
  const [tripoSRRunning, setTripoSRRunning] = useState(false);
  const [tripoSRUrl, setTripoSRUrl] = useState('http://127.0.0.1:7860'); // 本地TripoSR服务地址
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setModelGenerated(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setModelGenerated(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理拖拽进入事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // 清除图片
  const clearImage = () => {
    setImage(null);
    setModelGenerated(false);
  };
  
  // 检查TripoSR服务是否运行
  const checkTripoSRStatus = async () => {
    try {
      const response = await fetch(`${tripoSRUrl}/api/heartbeat`, {
        method: 'GET',
        mode: 'no-cors',
      });
      setTripoSRRunning(true);
      return true;
    } catch (error) {
      console.error('无法连接到TripoSR服务:', error);
      setTripoSRRunning(false);
      return false;
    }
  };
  
  // 生成3D模型
  const generateModel = async () => {
    if (!image) return;
    
    setProcessing(true);
    
    // 检查TripoSR服务是否运行
    const isRunning = await checkTripoSRStatus();
    
    if (!isRunning) {
      alert('请先启动TripoSR服务！请双击 "@双击运行TripoSR程序.bat" 文件启动服务。');
      setProcessing(false);
      return;
    }
    
    // TripoSR服务已启动，将图像直接发送到Gradio界面
    // 这里不实际发送API请求，因为Gradio接口需要在UI中手动操作
    // 我们只是告诉用户如何使用TripoSR
    
    // 模拟处理延迟，实际上是让用户去操作TripoSR UI
    setTimeout(() => {
      setModelUrl(`${tripoSRUrl}`); // 设置为TripoSR界面URL
      setModelGenerated(true);
      setProcessing(false);
    }, 1000);
  };
  
  // 打开TripoSR界面
  const openTripoSRInterface = () => {
    window.open(tripoSRUrl, '_blank');
  };
  
  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };
  
  // 相机捕获（演示功能）
  const captureFromCamera = () => {
    // 这里应该打开摄像头，此处仅为演示
    alert('摄像头功能需要实际实现');
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">3D眼球建模工具</h1>
      <p className="text-gray-600 mb-8">使用TripoSR技术，根据眼部图像快速生成精准的3D眼球模型</p>
      
      {/* 使用说明卡片 */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-700">使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            本功能使用TripoSR_AI.toolbox进行3D模型生成。请先双击"@双击运行TripoSR程序.bat"文件启动TripoSR服务，然后在此界面上传图像并点击"生成3D模型"按钮。系统将打开TripoSR界面，请在该界面中完成模型生成。
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：图像上传和处理区域 */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>图像处理区域</CardTitle>
              <CardDescription>
                上传眼部图像以生成3D模型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="upload" className="flex-1">上传图像</TabsTrigger>
                  <TabsTrigger value="camera" className="flex-1">拍摄照片</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 flex flex-col items-center justify-center 
                                ${image ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                    style={{ minHeight: '300px' }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {image ? (
                      <div className="relative w-full h-64">
                        <img 
                          src={image} 
                          alt="Uploaded eye" 
                          className="w-full h-full object-contain"
                        />
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="absolute top-2 right-2"
                          onClick={clearImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          ref={fileInputRef}
                        />
                        <Upload className="w-12 h-12 text-blue-500 mb-4" />
                        <p className="text-center text-gray-600 mb-2">拖放图像到此处，或</p>
                        <Button onClick={openFileSelector} variant="outline">
                          浏览文件
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="camera">
                  <div className="border-2 border-dashed rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
                    <Camera className="w-12 h-12 text-blue-500 mb-4" />
                    <p className="text-center text-gray-600 mb-4">使用摄像头拍摄眼部照片</p>
                    <Button onClick={captureFromCamera}>
                      启用摄像头
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={clearImage} disabled={!image}>
                清除图像
              </Button>
              <Button 
                onClick={generateModel} 
                disabled={!image || processing}
                className={processing ? 'opacity-70' : ''}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : modelGenerated ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新生成
                  </>
                ) : (
                  '生成3D模型'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* 控制面板 */}
          {modelGenerated && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>TripoSR操作</CardTitle>
                <CardDescription>
                  打开TripoSR界面并完成模型生成
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 mb-3">点击下方按钮打开TripoSR界面，然后：</p>
                  <ol className="text-left text-gray-700 space-y-2 mb-4">
                    <li>1. 上传您刚才准备的图像</li>
                    <li>2. 根据需要调整前景比例</li>
                    <li>3. 点击"Generate"按钮生成模型</li>
                    <li>4. 等待模型生成完成</li>
                    <li>5. 使用3D视图查看和下载您的模型</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={openTripoSRInterface}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  打开TripoSR界面
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* 右侧：3D模型查看区域 */}
        <div>
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle>3D模型预览</CardTitle>
              <CardDescription>
                {modelGenerated ? 
                  '请在TripoSR界面中完成模型生成' : 
                  '请先生成3D模型'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center" style={{ minHeight: '500px' }}>
              {modelGenerated ? (
                <div className="w-full h-full flex flex-col items-center justify-center" style={{ minHeight: '450px' }}>
                  <div className="bg-blue-50 p-8 rounded-lg shadow-inner w-full h-full flex flex-col items-center justify-center">
                    <Eye className="w-32 h-32 text-blue-400 mb-4" />
                    <p className="text-blue-700 text-center mb-6">
                      请在TripoSR界面中完成3D模型的生成和查看
                    </p>
                    <Button onClick={openTripoSRInterface} variant="outline" className="mb-4">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      打开TripoSR界面
                    </Button>
                    <p className="text-gray-500 text-xs text-center">
                      TripoSR是一个先进的3D模型生成工具，可以从单张图像生成高质量的3D模型
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-10">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200 flex items-center justify-center mb-4">
                    <Eye className="w-16 h-16" />
                  </div>
                  <p className="text-center">上传图片并生成3D模型后，将显示在此处</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 技术说明区域 */}
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-blue-700 mb-4">TripoSR技术说明</h2>
        <p className="text-gray-700 mb-4">
          TripoSR（Three-dimensional Reconstruction with Single-view Images）是一种先进的3D重建技术，由Tripo AI和Stability AI开发。它可以从单一视角的图像中重建出完整的3D模型，使用深度神经网络估计图像中物体的3D形状、纹理和材质，特别适用于医学图像处理。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-blue-600 mb-2">高精度重建</h3>
            <p className="text-sm text-gray-600">利用先进的神经网络模型，精确捕捉眼球的细微结构和特征。</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-blue-600 mb-2">快速处理</h3>
            <p className="text-sm text-gray-600">优化的推理算法，可以在几秒钟内完成从2D图像到3D模型的转换。</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-blue-600 mb-2">医学应用</h3>
            <p className="text-sm text-gray-600">专为眼科医学设计，可用于诊断规划、教学和患者沟通。</p>
          </div>
        </div>
      </div>
    </div>
  );
}