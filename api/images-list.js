const { getImages, getCategories } = require('./images');
const { verifyAdminToken } = require('./auth-middleware');

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Content-Type', 'application/json');
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
    
    try {
        // 从查询参数获取分页和过滤信息
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category || null;
        
        // 验证参数
        if (page < 1) {
            return res.status(400).json({ error: 'Page must be greater than 0' });
        }
        
        if (limit < 1 || limit > 100) {
            return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }
        
        // 获取图片列表
        const result = getImages(page, limit, category);
        
        // 获取所有分类
        const categories = getCategories();
        
        // 返回结果
        return res.status(200).json({
            success: true,
            ...result,
            categories
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};