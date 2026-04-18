const axios = require('axios');

async function testSovitsAPI() {
    const baseUrl = 'http://127.0.0.1:8000';
    
    console.log('测试 1: 使用 POST 请求 /models (旧方式)');
    try {
        const response1 = await axios.post(`${baseUrl}/models`, { version: "v2ProPlus" });
        console.log('✅ POST 成功:', response1.data);
    } catch (error) {
        console.log('❌ POST 失败:', error.response?.status, error.response?.data?.detail || error.message);
    }
    
    console.log('\n测试 2: 使用 GET 请求 /models/v2ProPlus (新方式)');
    try {
        const response2 = await axios.get(`${baseUrl}/models/v2ProPlus`);
        console.log('✅ GET 成功:', response2.data.msg, '模型数量:', Object.keys(response2.data.models || {}).length);
        console.log('模型列表:', Object.keys(response2.data.models || {}));
    } catch (error) {
        console.log('❌ GET 失败:', error.response?.status, error.response?.data?.detail || error.message);
    }
}

testSovitsAPI();
