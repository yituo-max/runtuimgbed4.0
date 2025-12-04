# 部署指南

## Vercel部署

您的图片床应用已成功部署到Vercel！

### 部署状态

✅ **部署成功**
- 生产环境URL: https://runtuimgbed20-3fyxnmgb3-r-zs-projects-83e4b1bf.vercel.app
- 检查URL: https://vercel.com/r-zs-projects-83e4b1bf/runtu_imgbed2.0/AALfVPFBwDBafAb5S1Rx4UAhjhKc

### 环境变量配置

为了使应用完全正常工作，您需要在Vercel项目设置中配置以下环境变量：

1. 访问 https://vercel.com/r-zs-projects-83e4b1bf/runtu_imgbed2.0/settings/environment-variables
2. 添加以下环境变量：

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| TELEGRAM_BOT_TOKEN | Telegram机器人令牌 | 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 |
| TELEGRAM_CHAT_ID | Telegram聊天ID | 123456789 |
| ADMIN_USERNAME | 管理员用户名 | admin |
| ADMIN_PASSWORD | 管理员密码 | password123 |
| JWT_SECRET | JWT签名密钥 | 60f0b9a35c1e06ad511d308cc790cf5ed257be70f9e1ca3c2c5710c5eefac47e |

### 部署方法

#### 方法1: 使用Vercel CLI

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel --prod
```

#### 方法2: 使用GitHub集成

1. 将代码推送到GitHub仓库
2. 在Vercel控制台中导入GitHub仓库
3. 配置环境变量
4. 自动部署

### 部署后测试

1. 访问部署URL: https://runtuimgbed20-3fyxnmgb3-r-zs-projects-83e4b1bf.vercel.app
2. 测试图片上传功能
3. 验证Telegram通知功能
4. 检查管理员登录功能

### 注意事项

- 文件大小限制: 25MB
- 请求频率限制: 根据您的Vercel计划而定
- 确保所有环境变量已正确配置
- 图片存储在本地img目录中，确保有足够的存储空间

### 故障排除

1. **上传失败**: 检查环境变量是否正确配置
2. **Telegram通知失败**: 验证BOT_TOKEN和CHAT_ID是否有效
3. **登录失败**: 确认管理员凭据和JWT_SECRET设置正确
4. **API 404错误**: 确保所有API文件都在api目录中，并且vercel.json配置正确

### 项目结构

```
runtu_imgbed2.0/
├── api/                  # Vercel函数目录
│   ├── upload.js         # 图片上传API
│   ├── list.js           # 图片列表API
│   ├── delete.js         # 图片删除API
│   ├── login.js          # 登录API
│   └── test.js           # 测试API
├── img/                  # 图片存储目录
├── index.html            # 前端页面
├── style.css             # 样式文件
├── script.js             # 前端脚本
├── vercel.json           # Vercel配置文件
└── DEPLOY.md             # 部署指南
```

### 后续步骤

1. 配置自定义域名（可选）
2. 设置CDN加速（可选）
3. 配置监控和日志（可选）
4. 设置自动备份（可选）