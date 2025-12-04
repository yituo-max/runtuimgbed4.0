const { verifyAdminToken } = require('./auth-middleware');

// 模拟图片数据库（在实际应用中应该使用真实数据库）
let imagesDatabase = [
    {
        id: 'img001',
        filename: 'example1.jpg',
        url: 'https://api.telegram.org/file/bot<TOKEN>/photos/file_1.jpg',
        size: 1024000,
        uploadTime: '2023-05-15T10:30:00Z',
        category: 'default'
    },
    {
        id: 'img002',
        filename: 'example2.png',
        url: 'https://api.telegram.org/file/bot<TOKEN>/photos/file_2.png',
        size: 2048000,
        uploadTime: '2023-05-16T14:20:00Z',
        category: 'nature'
    },
    {
        id: 'img003',
        filename: 'example3.gif',
        url: 'https://api.telegram.org/file/bot<TOKEN>/photos/file_3.gif',
        size: 512000,
        uploadTime: '2023-05-17T09:15:00Z',
        category: 'default'
    }
];

exports.handler = async function(event, context) {
    // 设置CORS头
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };
    
    // 处理预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }
    
    // 只接受GET请求
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    // 验证管理员权限
    const authResult = verifyAdminToken(event);
    if (!authResult.valid) {
        return {
            statusCode: authResult.statusCode,
            headers,
            body: JSON.stringify({ error: authResult.error })
        };
    }
    
    try {
        // 获取查询参数
        const queryParams = event.queryStringParameters || {};
        const { page = 1, limit = 10, category } = queryParams;
        
        // 转换为数字
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        
        // 过滤分类
        let filteredImages = imagesDatabase;
        if (category && category !== 'all') {
            filteredImages = imagesDatabase.filter(img => img.category === category);
        }
        
        // 计算分页
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedImages = filteredImages.slice(startIndex, endIndex);
        
        // 返回结果
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                images: paginatedImages,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: filteredImages.length,
                    totalPages: Math.ceil(filteredImages.length / limitNum)
                }
            })
        };
    } catch (error) {
        console.error('Error fetching images:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

// 导出函数供其他模块使用（例如添加新图片）
module.exports = {
    addImage: (image) => {
        const newImage = {
            id: `img${Date.now()}`,
            ...image,
            uploadTime: new Date().toISOString()
        };
        imagesDatabase.unshift(newImage);
        return newImage;
    },
    deleteImage: (id) => {
        const index = imagesDatabase.findIndex(img => img.id === id);
        if (index !== -1) {
            const deletedImage = imagesDatabase.splice(index, 1)[0];
            return deletedImage;
        }
        return null;
    },
    getImage: (id) => {
        return imagesDatabase.find(img => img.id === id);
    }
};