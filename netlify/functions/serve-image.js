const { verifyAdminToken } = require('./auth-middleware');
const { getImage } = require('./images');

exports.handler = async function(event, context) {
    // 设置CORS头
    const headers = {
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
        // 从路径参数获取图片ID
        const pathParts = event.path.split('/');
        const imageId = pathParts[pathParts.length - 1];
        
        if (!imageId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Image ID is required' })
            };
        }
        
        // 获取图片信息
        const image = getImage(imageId);
        
        if (!image) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Image not found' })
            };
        }
        
        // 重定向到实际的图片URL
        return {
            statusCode: 302,
            headers: {
                ...headers,
                'Location': image.url
            },
            body: ''
        };
    } catch (error) {
        console.error('Error serving image:', error);
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