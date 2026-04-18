/**
 * LocalMusicSearch - 标签增强工具
 * 
 * 支持两种模式：
 * 1. 规则模式：基于文件名关键词匹配（快速，准确度一般）
 * 2. API 模式：调用网易云音乐 API（慢速，准确度高）
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// 配置
const INDEX_FILE = 'F:\\VCP\\VCPChat-main\\VCPDistributedServer\\Plugin\\LocalMusicSearch\\output\\music_index.json';
const BATCH_SIZE = 10;
const DELAY_MS = 1000;

// 模式选择：'rule' = 规则模式，'api' = API 模式
const MODE = process.argv.includes('--api') ? 'api' : 'rule';

console.log(`[模式] ${MODE === 'api' ? 'API 模式（联网）' : '规则模式（本地）'}`);

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 网易云音乐搜索 API
 */
async function searchNetease(keyword) {
  return new Promise((resolve, reject) => {
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(keyword)}&type=1&limit=1`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.result?.songs?.[0] || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * 从网易云数据提取标签
 */
function extractTagsFromNetease(songData, originalTags) {
  const tags = { ...originalTags };
  
  if (!songData) return tags;
  
  // 语言
  const artist = songData.artists?.[0]?.name || '';
  if (/[\u4e00-\u9fa5]/.test(artist + songData.name)) {
    tags.language = ['中文'];
  } else if (/[a-zA-Z]/.test(artist)) {
    tags.language = ['英文'];
  }
  
  // 年代
  if (songData.publishTime) {
    const year = new Date(songData.publishTime).getFullYear();
    if (year >= 1980 && year < 1990) tags.era = '1980s';
    else if (year >= 1990 && year < 2000) tags.era = '1990s';
    else if (year >= 2000 && year < 2010) tags.era = '2000s';
    else if (year >= 2010 && year < 2020) tags.era = '2010s';
    else if (year >= 2020) tags.era = '2020s';
  }
  
  // 风格
  const album = songData.album?.name || '';
  if (album.includes('古典') || album.includes('Classical')) tags.genre = ['古典'];
  else if (album.includes('电子') || album.includes('Electronic')) tags.genre = ['电子'];
  else if (album.includes('摇滚') || album.includes('Rock')) tags.genre = ['摇滚'];
  else if (album.includes('爵士') || album.includes('Jazz')) tags.genre = ['爵士'];
  else if (album.includes('民谣')) tags.genre = ['民谣'];
  else tags.genre = ['流行'];
  
  return tags;
}

/**
 * 基于规则的标签生成
 */
function generateTagsByRules(fileName, artist, title) {
  const tags = {
    mood: [],
    scene: [],
    genre: [],
    language: [],
    era: 'unknown',
    tempo: 'medium'
  };
  
  const text = `${artist} ${title} ${fileName}`.toLowerCase();
  
  // 语言
  if (/[\u4e00-\u9fa5]/.test(text)) tags.language.push('中文');
  if (/[a-zA-Z]/.test(text)) tags.language.push('英文');
  if (/japanese|jpop|アニメ/.test(text)) tags.language.push('日文');
  if (/korean|kpop|한국/.test(text)) tags.language.push('韩文');
  
  // 情绪
  const moodMap = {
    '欢快': ['happy', 'joy', 'sun', 'party', 'dance', '快乐', '开心', '阳光'],
    '伤感': ['sad', 'blue', 'tear', 'cry', '悲伤', '眼泪', '心痛'],
    '浪漫': ['love', 'romantic', 'kiss', 'heart', '爱情', '恋人', '甜蜜'],
    '励志': ['strong', 'fight', 'dream', 'believe', '梦想', '坚强', '勇敢'],
    '平静': ['quiet', 'peace', 'zen', 'meditation', '安静', '平和'],
    '激情': ['fire', 'power', 'energy', 'rock', '激情', '热血'],
    '怀旧': ['old', 'memory', 'nostalgia', '回忆', '往事', '当年'],
    '孤独': ['alone', 'lonely', 'solitude', '孤单', '寂寞']
  };
  
  for (const [mood, keywords] of Object.entries(moodMap)) {
    if (keywords.some(kw => text.includes(kw))) tags.mood.push(mood);
  }
  
  // 场景
  const sceneMap = {
    '开车': ['drive', 'road', 'car', '高速', '公路', '自驾'],
    '运动': ['sport', 'run', 'gym', 'workout', '健身', '跑步'],
    '学习': ['study', 'focus', '学习', '专注'],
    '睡眠': ['sleep', 'night', 'dream', '睡眠', '夜晚'],
    '旅行': ['travel', 'trip', 'journey', '旅行', '路上'],
    '派对': ['party', 'celebrate', 'dance', '派对', '聚会'],
    '恋爱': ['dating', 'romance', 'love', '约会', '恋爱', '甜蜜']
  };
  
  for (const [scene, keywords] of Object.entries(sceneMap)) {
    if (keywords.some(kw => text.includes(kw))) tags.scene.push(scene);
  }
  
  // 风格
  const genreMap = {
    '流行': ['pop', '流行'],
    '摇滚': ['rock', '摇滚'],
    '民谣': ['folk', '民谣'],
    '电子': ['electronic', 'edm', '电子', 'dj'],
    '古典': ['classical', 'bach', 'mozart', '古典'],
    '爵士': ['jazz', '爵士'],
    '说唱': ['rap', 'hiphop', '说唱', '嘻哈'],
    '轻音乐': ['instrumental', 'piano', 'guitar', '纯音乐', '钢琴'],
    '影视原声': ['ost', 'soundtrack', '主题曲', '插曲']
  };
  
  for (const [genre, keywords] of Object.entries(genreMap)) {
    if (keywords.some(kw => text.includes(kw))) tags.genre.push(genre);
  }
  
  // 默认值
  if (tags.mood.length === 0) tags.mood.push('普通');
  if (tags.scene.length === 0) tags.scene.push('日常');
  if (tags.genre.length === 0) tags.genre.push('流行');
  if (tags.language.length === 0) tags.language.push('未知');
  
  return tags;
}

/**
 * 主函数
 */
async function enhanceMusicTags() {
  console.log('========================================');
  console.log('  LocalMusicSearch - 标签增强工具');
  console.log('========================================\n');
  
  // 读取索引
  let musicData;
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    musicData = JSON.parse(content);
    console.log(`✅ 读取成功：${musicData.musicFiles.length} 首歌曲`);
  } catch (error) {
    console.error('❌ 读取失败:', error.message);
    return { success: false };
  }
  
  const totalSongs = musicData.musicFiles.length;
  let updatedCount = 0;
  let apiCallCount = 0;
  
  console.log(`\n开始处理...\n`);
  
  // 批量处理
  for (let i = 0; i < totalSongs; i += BATCH_SIZE) {
    const batch = musicData.musicFiles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalSongs / BATCH_SIZE);
    
    console.log(`[批次 ${batchNum}/${totalBatches}]`);
    
    for (const song of batch) {
      let newTags;
      
      if (MODE === 'api') {
        // API 模式：调用网易云 API
        const keyword = `${song.artist} ${song.title}`;
        const apiResult = await searchNetease(keyword);
        
        if (apiResult) {
          newTags = extractTagsFromNetease(apiResult, song.tags);
          apiCallCount++;
          await delay(DELAY_MS); // 避免 API 限流
        } else {
          // API 未找到，降级到规则
          newTags = generateTagsByRules(song.fileName, song.artist, song.title);
        }
      } else {
        // 规则模式
        newTags = generateTagsByRules(song.fileName, song.artist, song.title);
      }
      
      // 更新
      const hasChanged = JSON.stringify(song.tags) !== JSON.stringify(newTags);
      if (hasChanged) {
        song.tags = newTags;
        song.searchKeys = `${song.artist} ${song.title} ${newTags.mood.join(' ')} ${newTags.scene.join(' ')} ${newTags.genre.join(' ')}`.toLowerCase();
        updatedCount++;
      }
    }
    
    console.log(`  进度：${Math.min(i + BATCH_SIZE, totalSongs)}/${totalSongs} (${Math.round((i + BATCH_SIZE) / totalSongs * 100)}%)`);
  }
  
  // 更新统计
  const tagStats = { mood: {}, scene: {}, genre: {}, language: {} };
  musicData.musicFiles.forEach(file => {
    file.tags.mood.forEach(m => tagStats.mood[m] = (tagStats.mood[m] || 0) + 1);
    file.tags.scene.forEach(s => tagStats.scene[s] = (tagStats.scene[s] || 0) + 1);
    file.tags.genre.forEach(g => tagStats.genre[g] = (tagStats.genre[g] || 0) + 1);
    file.tags.language.forEach(l => tagStats.language[l] = (tagStats.language[l] || 0) + 1);
  });
  
  musicData.stats.tagStats = tagStats;
  musicData.generatedAt = new Date().toISOString();
  
  // 保存
  await fs.writeFile(INDEX_FILE, JSON.stringify(musicData, null, 2), 'utf-8');
  
  // 输出统计
  console.log('\n========================================');
  console.log('  完成统计');
  console.log('========================================');
  console.log(`处理歌曲：${totalSongs}`);
  console.log(`更新歌曲：${updatedCount}`);
  if (MODE === 'api') {
    console.log(`API 调用：${apiCallCount}`);
  }
  
  console.log('\n情绪标签 TOP5:');
  Object.entries(tagStats.mood).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .forEach(([tag, count]) => console.log(`  ${tag}: ${count}首`));
  
  console.log('\n场景标签 TOP5:');
  Object.entries(tagStats.scene).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .forEach(([tag, count]) => console.log(`  ${tag}: ${count}首`));
  
  console.log('\n音乐风格 TOP5:');
  Object.entries(tagStats.genre).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .forEach(([tag, count]) => console.log(`  ${tag}: ${count}首`));
  
  console.log('\n========================================');
  console.log('✅ 标签增强完成！');
  console.log('========================================');
  
  return { success: true, totalSongs, updatedCount, tagStats };
}

// 导出
module.exports = { enhanceMusicTags, generateTagsByRules, searchNetease };

// 运行
if (require.main === module) {
  enhanceMusicTags().catch(error => {
    console.error('程序执行失败:', error);
    process.exit(1);
  });
}
