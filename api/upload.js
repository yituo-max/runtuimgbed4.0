const https = require('https');
const querystring = require('querystring');
const { verifyAdminToken } = require('./auth-middleware');
const { addImage } = require('./images');

// 从环境变量获取配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITE_URL = process.env.SITE_URL || 'https://your-site.vercel.app';

// 简单的请求频率限制
const requestCounts = {};
const RATE_LIMIT_WINDOW = 60000; // 1分钟
const RATE_LIMIT_MAX_REQUESTS = 10; // 每分钟最多10次请求

// 检查请求频率限制
function checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // 初始化客户端计数器
    if (!requestCounts[clientId]) {
        requestCounts[clientId] = [];
    }
    
    // 清理过期的请求记录
    requestCounts[clientId] = requestCounts[clientId].filter(timestamp => timestamp > windowStart);
    
    // 检查是否超过限制
    if (requestCounts[clientId].length >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    
    // 记录当前请求
    requestCounts[clientId].push(now);
    return true;
}

module.exports = async (req, res) => {
    // 只在开发环境记录详细日志
    const isDev = process.env.NODE_ENV === 'development';
    
    // 设置CORS头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 只接受POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 验证管理员权限
    const authResult = verifyAdminToken(req);
    if (!authResult.valid) {
        return res.status(authResult.statusCode).json({ error: authResult.error });
    }

    // 获取客户端ID进行频率限制
    const clientId = req.headers['x-forwarded-for'] || 
                     req.headers['client-ip'] || 
                     req.connection.remoteAddress || 
                     'unknown';
    
    // 检查请求频率限制
    if (!checkRateLimit(clientId)) {
        return res.status(429).json({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
        });
    }

    try {
        // 检查是否有文件上传
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const imageFile = req.files.image;
        
        // 检查文件大小（限制为5MB）
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
            return res.status(413).json({ 
                error: 'File too large. Maximum size is 5MB.' 
            });
        }

        // 上传图片到Telegram
        const telegramResponse = await uploadToTelegram(imageFile);
        
        if (!telegramResponse.ok) {
            return res.status(500).json({ 
                error: 'Failed to upload to Telegram',
                details: telegramResponse.description || 'Unknown error'
            });
        }

        // 获取图片信息
        const file = telegramResponse.result.photo[telegramResponse.result.photo.length - 1];
        const fileId = file.file_id;
        
        // 获取文件路径
        const fileResponse = await getTelegramFilePath(fileId);
        
        if (!fileResponse.ok) {
            return res.status(500).json({ 
                error: 'Failed to get file path',
                details: fileResponse.description || 'Unknown error'
            });
        }

        // 构建图片URL
        const imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileResponse.result.file_path}`;
        
        // 保存图片信息到数据库
        const imageInfo = {
            filename: imageFile.name,
            url: imageUrl,
            size: file.file_size,
            fileId: fileId,
            category: req.body.category || 'general'
        };
        
        const savedImage = addImage(imageInfo);
        
        // 返回结果
        return res.status(200).json({
            success: true,
            image: savedImage
        });
    } catch (error) {
        if (isDev) {
            console.error('Error details:', error);
        }
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// 上传图片到Telegram
async function uploadToTelegram(imageFile) {
    return new Promise((resolve, reject) => {
        try {
            // 创建multipart/form-data格式的数据
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
            
            let formData = '';
            
            // 添加chat_id字段
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
            formData += `${TELEGRAM_CHAT_ID}\r\n`;
            
            // 添加photo字段
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="photo"; filename="${imageFile.name}"\r\n`;
            formData += `Content-Type: ${imageFile.mimetype}\r\n\r\n`;
            
            const formDataHeader = Buffer.from(formData, 'utf8');
            const formDataFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
            
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': formDataHeader.length + imageFile.data.length + formDataFooter.length
                },
                timeout: 15000 // 15秒超时
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${response.description || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            // 发送数据
            req.write(formDataHeader);
            req.write(imageFile.data);
            req.write(formDataFooter);
            req.end();
        } catch (error) {
            reject(error);
        }
    });
}

// 获取Telegram文件路径
async function getTelegramFilePath(fileId) {
    return new Promise((resolve, reject) => {
        try {
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
                method: 'GET',
                timeout: 10000 // 10秒超时
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${response.description || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse getFile response: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        } catch (error) {
            reject(error);
        }
    });
}