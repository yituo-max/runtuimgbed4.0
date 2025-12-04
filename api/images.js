// 使用Vercel KV数据库
const {
  getImages,
  getImage,
  addImage,
  updateImage,
  deleteImage,
  getCategories,
  getStats
} = require('./kv-database');

// 导出所有函数，保持与原有API的兼容性
module.exports = {
  getImages,
  getImage,
  addImage,
  updateImage,
  deleteImage,
  getCategories,
  getStats
};