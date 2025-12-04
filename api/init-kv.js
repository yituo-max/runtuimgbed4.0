// 初始化KV数据库的API端点
const { createClient } = require('@vercel/kv');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 创建KV客户端
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    
    // 检查是否已经初始化
    const isInitialized = await kv.get('imgbed:initialized');
    
    if (isInitialized) {
      return res.status(200).json({
        success: true,
        message: '数据库已经初始化',
        alreadyInitialized: true
      });
    }
    
    // 初始化分类集合
    await kv.sadd('imgbed:categories', 'general');
    
    // 初始化统计信息
    await kv.hset('imgbed:stats', {
      totalImages: 0,
      totalCategories: 1,
      lastInitDate: new Date().toISOString()
    });
    
    // 设置初始化标记
    await kv.set('imgbed:initialized', 'true');
    
    return res.status(200).json({
      success: true,
      message: 'KV数据库初始化成功',
      alreadyInitialized: false
    });
  } catch (error) {
    console.error('初始化KV数据库时出错:', error);
    return res.status(500).json({
      success: false,
      error: '初始化失败',
      details: error.message
    });
  }
};