/**
 * LocalMusicSearch - Agent 搜索工具
 * 
 * 功能：提供 search 接口，Agent 可根据 mood、scene、genre 等标签搜索歌曲
 * 使用方式：
 *   const result = await search({ mood: '欢快', scene: '开车', limit: 10 });
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const INDEX_FILE = 'F:\\VCP\\VCPChat-main\\VCPDistributedServer\\Plugin\\LocalMusicSearch\\output\\music_index.json';

/**
 * 搜索音乐
 * @param {Object} options - 搜索选项
 * @param {string|string[]} [options.mood] - 情绪标签（支持单个或数组）
 * @param {string|string[]} [options.scene] - 场景标签（支持单个或数组）
 * @param {string|string[]} [options.genre] - 风格标签（支持单个或数组）
 * @param {string|string[]} [options.language] - 语言标签（支持单个或数组）
 * @param {string} [options.artist] - 歌手（模糊匹配）
 * @param {string} [options.title] - 歌曲名（模糊匹配）
 * @param {number} [options.limit] - 返回数量限制（默认 10）
 * @param {string} [options.era] - 年代
 * @returns {Promise<Object>} 搜索结果
 */
async function search(options = {}) {
  console.log('[LocalMusicSearch] 搜索请求:', JSON.stringify(options));
  
  // 读取索引
  let musicData;
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    musicData = JSON.parse(content);
  } catch (error) {
    console.error('[LocalMusicSearch] 读取索引失败:', error.message);
    return {
      success: false,
      error: '索引文件不存在或格式错误',
      songs: []
    };
  }
  
  const { mood, scene, genre, language, artist, title, era, limit = 10 } = options;
  
  // 过滤歌曲
  let filtered = musicData.musicFiles.filter(song => {
    // 情绪标签匹配
    if (mood) {
      const moodList = Array.isArray(mood) ? mood : [mood];
      if (!moodList.some(m => song.tags.mood.includes(m))) return false;
    }
    
    // 场景标签匹配
    if (scene) {
      const sceneList = Array.isArray(scene) ? scene : [scene];
      if (!sceneList.some(s => song.tags.scene.includes(s))) return false;
    }
    
    // 风格标签匹配
    if (genre) {
      const genreList = Array.isArray(genre) ? genre : [genre];
      if (!genreList.some(g => song.tags.genre.includes(g))) return false;
    }
    
    // 语言标签匹配
    if (language) {
      const langList = Array.isArray(language) ? language : [language];
      if (!langList.some(l => song.tags.language.includes(l))) return false;
    }
    
    // 年代匹配
    if (era && song.tags.era !== era) return false;
    
    // 歌手模糊匹配
    if (artist && !song.artist.toLowerCase().includes(artist.toLowerCase())) return false;
    
    // 歌曲名模糊匹配
    if (title && !song.title.toLowerCase().includes(title.toLowerCase())) return false;
    
    return true;
  });
  
  // 随机打乱并限制数量
  filtered = filtered.sort(() => Math.random() - 0.5).slice(0, limit);
  
  // 返回简化版歌曲信息（移除冗余字段）
  const songs = filtered.map(song => ({
    id: song.id,
    artist: song.artist,
    title: song.title,
    fileName: song.fileName,
    path: song.path,
    size: song.size,
    sizeFormatted: song.sizeFormatted,
    tags: song.tags,
    searchKeys: song.searchKeys
  }));
  
  console.log(`[LocalMusicSearch] 找到 ${songs.length} 首歌曲`);
  
  return {
    success: true,
    total: filtered.length,
    limit: limit,
    songs: songs,
    query: options
  };
}

/**
 * 获取所有可用的标签统计
 */
async function getTagStats() {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    const musicData = JSON.parse(content);
    
    return {
      success: true,
      stats: musicData.stats.tagStats,
      totalSongs: musicData.stats.totalFiles
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: {}
    };
  }
}

/**
 * 获取歌曲详情
 */
async function getSongById(id) {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    const musicData = JSON.parse(content);
    
    const song = musicData.musicFiles.find(s => s.id === id);
    
    if (song) {
      return {
        success: true,
        song: {
          id: song.id,
          artist: song.artist,
          title: song.title,
          fileName: song.fileName,
          path: song.path,
          size: song.size,
          sizeFormatted: song.sizeFormatted,
          tags: song.tags
        }
      };
    }
    
    return {
      success: false,
      error: `未找到 ID 为 ${id} 的歌曲`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 随机推荐歌曲
 */
async function getRandomSongs(limit = 5, tags = {}) {
  const result = await search({ ...tags, limit });
  return result;
}

// 导出
module.exports = { search, getTagStats, getSongById, getRandomSongs };

// 命令行测试
if (require.main === module) {
  (async () => {
    console.log('========================================');
    console.log('  LocalMusicSearch - 搜索工具测试');
    console.log('========================================\n');
    
    // 测试 1：按情绪搜索
    console.log('[测试 1] 搜索欢快的歌曲...');
    const result1 = await search({ mood: '欢快', limit: 3 });
    console.log(`找到 ${result1.songs.length} 首歌曲`);
    result1.songs.forEach(s => console.log(`  - ${s.artist} - ${s.title}`));
    
    console.log('\n[测试 2] 搜索适合开车的歌曲...');
    const result2 = await search({ scene: '开车', limit: 3 });
    console.log(`找到 ${result2.songs.length} 首歌曲`);
    result2.songs.forEach(s => console.log(`  - ${s.artist} - ${s.title}`));
    
    console.log('\n[测试 3] 获取标签统计...');
    const stats = await getTagStats();
    if (stats.success) {
      console.log(`总歌曲数：${stats.totalSongs}`);
      console.log('情绪标签:', stats.stats.mood);
    }
    
    console.log('\n========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
  })().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}
