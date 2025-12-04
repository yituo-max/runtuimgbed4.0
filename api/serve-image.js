const { verifyAdminToken } = require('./auth-middleware');
const { getImage } = require('./images');

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 只接受GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 验证管理员权限
    const authResult = verifyAdminToken(req);
    if (!authResult.valid) {
        return res.status(authResult.statusCode).json({ error: authResult.error });
    }
    
    try {
        // 从查询参数获取图片ID
        const imageId = req.query.id;
        
        if (!imageId) {
            return res.status(400).json({ error: 'Image ID is required' });
        }
        
        // 获取图片信息
        const image = getImage(imageId);
        
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        
        // 重定向到实际的图片URL
        return res.redirect(302, image.url);
    } catch (error) {
        console.error('Error serving image:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};