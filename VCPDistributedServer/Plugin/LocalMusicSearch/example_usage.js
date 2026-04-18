/**
 * LocalMusicSearch - Agent 使用示例
 * 
 * 演示如何在 Agent 中调用 LocalMusicSearch 工具
 */

const { search, getTagStats, getSongById, getRandomSongs } = require('./search.js');

/**
 * 示例 1：根据情绪搜索
 */
async function searchByMood() {
  console.log('\n=== 示例 1：根据情绪搜索 ===');
  
  // 找欢快的歌
  const happySongs = await search({ mood: '欢快', limit: 5 });
  console.log('欢快的歌曲:');
  happySongs.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
  
  // 找伤感的歌
  const sadSongs = await search({ mood: '伤感', limit: 5 });
  console.log('\n伤感的歌曲:');
  sadSongs.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
}

/**
 * 示例 2：根据场景搜索
 */
async function searchByScene() {
  console.log('\n=== 示例 2：根据场景搜索 ===');
  
  // 找适合开车的歌
  const drivingSongs = await search({ scene: '开车', limit: 5 });
  console.log('适合开车的歌曲:');
  drivingSongs.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
  
  // 找适合睡眠的歌
  const sleepSongs = await search({ scene: '睡眠', limit: 5 });
  console.log('\n适合睡眠的歌曲:');
  sleepSongs.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
}

/**
 * 示例 3：组合搜索
 */
async function searchCombined() {
  console.log('\n=== 示例 3：组合搜索 ===');
  
  // 找浪漫的中文流行歌
  const romanticChinese = await search({
    mood: '浪漫',
    genre: '流行',
    language: '中文',
    limit: 5
  });
  console.log('浪漫的中文流行歌:');
  romanticChinese.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
  
  // 找激情的摇滚乐
  const rockSongs = await search({
    mood: '激情',
    genre: '摇滚',
    limit: 5
  });
  console.log('\n激情的摇滚乐:');
  rockSongs.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
  });
}

/**
 * 示例 4：获取标签统计
 */
async function showTagStats() {
  console.log('\n=== 示例 4：获取标签统计 ===');
  
  const stats = await getTagStats();
  if (stats.success) {
    console.log(`总歌曲数：${stats.totalSongs}`);
    console.log('\n情绪标签分布:');
    Object.entries(stats.stats.mood)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count}首`);
      });
    
    console.log('\n场景标签分布:');
    Object.entries(stats.stats.scene)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count}首`);
      });
  }
}

/**
 * 示例 5：随机推荐
 */
async function showRandomRecommendations() {
  console.log('\n=== 示例 5：随机推荐 ===');
  
  // 随机推荐 5 首
  const random = await getRandomSongs(5);
  console.log('随机推荐的歌曲:');
  random.songs.forEach(song => {
    console.log(`  ${song.id}. ${song.artist} - ${song.title}`);
    console.log(`     标签：${song.tags.mood.join(', ')} | ${song.tags.scene.join(', ')}`);
  });
}

/**
 * 示例 6：根据 ID 获取详情
 */
async function showSongDetail() {
  console.log('\n=== 示例 6：根据 ID 获取详情 ===');
  
  const result = await getSongById(1);
  if (result.success) {
    const song = result.song;
    console.log(`歌曲详情:`);
    console.log(`  ID: ${song.id}`);
    console.log(`  歌手：${song.artist}`);
    console.log(`  歌曲：${song.title}`);
    console.log(`  文件名：${song.fileName}`);
    console.log(`  路径：${song.path}`);
    console.log(`  大小：${song.sizeFormatted}`);
    console.log(`  标签:`);
    console.log(`    情绪：${song.tags.mood.join(', ')}`);
    console.log(`    场景：${song.tags.scene.join(', ')}`);
    console.log(`    风格：${song.tags.genre.join(', ')}`);
    console.log(`    语言：${song.tags.language.join(', ')}`);
  }
}

/**
 * 主函数 - 运行所有示例
 */
async function main() {
  console.log('========================================');
  console.log('  LocalMusicSearch - Agent 使用示例');
  console.log('========================================');
  
  await searchByMood();
  await searchByScene();
  await searchCombined();
  await showTagStats();
  await showRandomRecommendations();
  await showSongDetail();
  
  console.log('\n========================================');
  console.log('✅ 所有示例运行完成！');
  console.log('========================================');
}

// 运行示例
main().catch(error => {
  console.error('运行失败:', error);
  process.exit(1);
});
