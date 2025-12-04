module.exports = async (req, res) => {
  console.log('Test API called with method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  
  // 设置CORS头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // 只允许GET请求
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Sending response');
  return res.status(200).json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  });
};