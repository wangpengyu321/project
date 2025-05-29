# 智能眼科诊断分析平台

![智能眼科诊断分析平台](https://img.shields.io/badge/版本-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-336791?logo=postgresql)

## 项目简介

智能眼科诊断分析平台是一个基于深度学习和图像分割技术的医疗辅助系统，旨在帮助眼科医生快速分析眼底照片和OCT扫描图像，提高诊断准确率，减轻医生工作负担，为患者提供更优质的眼科医疗服务。


https://github.com/user-attachments/assets/cb0b816d-66d0-4dbb-a04b-cbcd47c41fc7


本系统采用前后端分离架构，集成了最新的SAM(Segment Anything Model)图像分割模型，支持医生用户和患者用户多角色访问，具有完善的数据管理和安全机制。

## 核心功能

### 医生用户功能
- **AI辅助诊断**: 基于深度学习模型，对眼底照片和OCT扫描图像进行智能分析
- **实时图像分割**: 采用SAM算法精确识别和标注眼科影像中的细微结构和病变特征
- **远程会诊**: 支持多医生协作模式，便于专家远程会诊
- **病例管理**: 全面的患者病例管理系统，支持历史记录查询和报告生成

### 患者用户功能
- **检查记录查询**: 随时查看自己的眼科检查记录和诊断结果
- **预约管理**: 在线预约眼科检查，选择医生和时间
- **在线咨询**: 与主治医生进行在线交流
- **健康知识库**: 获取眼部保健和常见病防治知识

## 技术栈

### 前端
- React 19.0.0
- TypeScript 5.8.2
- React Router 7.2.0
- Tailwind CSS 4.0.11
- Radix UI组件库
- Chart.js (数据可视化)
- Zustand (状态管理)

### 后端
- Node.js 18.x
- Express 4.21.2
- PostgreSQL 14.x
- TypeScript
- Drizzle ORM
- JWT身份验证
- Express Session

### AI模型
- SAM (Segment Anything Model)
- PyTorch
- OpenCV
- NumPy

## 安装部署

### 环境要求
- Node.js 18.0.0+
- Python 3.8+
- PostgreSQL 14+

### 1. 克隆仓库
```bash
git clone https://github.com/wangpengyu321/project.git
cd eye-diagnosis-platform
```

### 2. 安装依赖

#### 前端
```bash
cd BackgroundCanvasManager/BackgroundCanvasManager/DynamicBackgroundCanvas/client
npm install
```

#### 后端
```bash
cd ../server
npm install
```

#### AI服务
```bash
cd ../../../new-sam-service
pip install -r requirements.txt
```

### 3. 配置环境变量
在server目录创建`.env`文件：
```
NODE_ENV=development
PORT=5000
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eyediagnosis
SESSION_SECRET=your_session_secret
```

### 4. 数据库设置
```bash
# 创建数据库
createdb eyediagnosis

# 运行初始化脚本
npm run db:migrate
```

### 5. 启动服务

#### 开发模式
```bash
# 启动后端服务
cd server
npm run dev

# 启动前端服务(新终端)
cd ../client
npm run dev

# 启动AI服务(新终端)
cd ../../../new-sam-service
python start_sam_api.py
```

#### 生产模式
```bash
# 构建前端
cd client
npm run build

# 启动服务
cd ../server
npm start
```

## 系统架构

```
eye-diagnosis-platform/
├── BackgroundCanvasManager/              # 主应用目录
│   └── BackgroundCanvasManager/
│       └── DynamicBackgroundCanvas/
│           ├── client/                   # 前端React应用
│           │   ├── src/
│           │   │   ├── components/       # UI组件
│           │   │   ├── pages/            # 页面组件
│           │   │   ├── hooks/            # 自定义hooks
│           │   │   ├── utils/            # 工具函数
│           │   │   ├── context/          # React上下文
│           │   │   └── App.tsx           # 应用入口
│           │   └── public/               # 静态资源
│           └── server/                   # 后端Express应用
│               ├── routes/               # API路由
│               ├── models/               # 数据模型
│               ├── utils/                # 工具函数
│               └── index.ts              # 服务器入口
├── new-sam-service/                      # AI服务模块
│   ├── samapi-env/                       # Python虚拟环境
│   ├── models/                           # 预训练模型
│   └── start_sam_api.py                  # SAM API服务
└── public/                               # 公共资源目录
```

## 使用说明

1. 系统分为医生端和患者端两种角色
2. 新用户需通过邮箱验证码完成注册流程
3. 医生用户可以上传眼科影像进行AI分析，生成诊断报告
4. 患者用户可以查看自己的检查记录和诊断结果

## 贡献指南

1. Fork项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件

## 联系方式

项目维护者: contact@eye-diagnosis.com
