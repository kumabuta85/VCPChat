/**
 * LocalMusicSearch - 音乐索引生成器
 * 
 * 功能：扫描指定目录中的所有 MP3 文件，提取文件名信息，生成基础索引
 * 输出：output/music_index.json
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const DEFAULT_MUSIC_DIRECTORY = process.env.MUSIC_DIRECTORY || 'E:\\本地音乐\\MP3';
const OUTPUT_DIRECTORY = process.env.OUTPUT_DIRECTORY || 'F:\\VCP\\VCPChat-main\\VCPDistributedServer\\Plugin\\LocalMusicSearch\\output';

/**
 * 解析文件名，提取歌手和歌曲信息
 * 支持格式：
 * - "歌手 - 歌曲.mp3"
 * - "歌手 - 歌曲 (备注).mp3"
 * - "歌曲.mp3" (无歌手信息)
 */
function parseFileName(fileName) {
  const baseName = fileName.replace('.mp3', '');
  
  // 尝试匹配 "歌手 - 歌曲" 格式
  const match = baseName.match(/^([^-]+)\s*-\s*(.+)$/);
  
  if (match) {
    return {
      artist: match[1].trim(),
      title: match[2].trim().replace(/\s*\([^)]*\)\s*$/, '') // 移除括号备注
    };
  }
  
  // 没有歌手信息，直接使用文件名作为歌曲名
  return {
    artist: '未知',
    title: baseName.trim()
  };
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/**
 * 生成音乐索引
 */
async function generateMusicIndex(musicDirectory = DEFAULT_MUSIC_DIRECTORY) {
  console.log('========================================');
  console.log('  LocalMusicSearch - 索引生成器');
  console.log('========================================\n');
  
  const targetDir = path.resolve(musicDirectory);
  const jsonOutput = path.join(OUTPUT_DIRECTORY, 'music_index.json');
  
  console.log(`[目标目录] ${targetDir}`);
  console.log(`[输出文件] ${jsonOutput}\n`);
  
  try {
    // 确保输出目录存在
    await fs.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    
    // 检查目录是否存在
    const exists = await fs.access(targetDir).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error(`目录不存在：${targetDir}`);
    }
    
    // 读取目录
    const items = await fs.readdir(targetDir);
    console.log(`✅ 目录读取成功，总项目数：${items.length}`);
    
    // 处理 MP3 文件
    const musicFiles = [];
    let totalSize = 0;
    
    for (const item of items) {
      if (item.toLowerCase().endsWith('.mp3')) {
        const itemPath = path.join(targetDir, item);
        const stats = await fs.stat(itemPath);
        
        const fileInfo = parseFileName(item);
        
        // 创建基础条目（tags 为空，等待 enhance_tags.js 填充）
        const musicEntry = {
          id: musicFiles.length + 1,
          fileName: item,
          artist: fileInfo.artist,
          title: fileInfo.title,
          tags: {
            mood: [],
            scene: [],
            genre: [],
            language: [],
            era: 'unknown',
            tempo: 'medium'
          },
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          path: itemPath,
          searchKeys: `${fileInfo.artist} ${fileInfo.title}`.toLowerCase()
        };
        
        musicFiles.push(musicEntry);
        totalSize += stats.size;
      }
    }
    
    console.log(`✅ 找到 ${musicFiles.length} 个 MP3 文件`);
    console.log(`💾 总大小：${formatFileSize(totalSize)}\n`);
    
    // 生成 JSON 索引文件（基础版，tags 为空）
    const jsonData = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      directory: targetDir,
      stats: {
        totalFiles: musicFiles.length,
        totalSize: totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        tagStats: {
          mood: {},
          scene: {},
          genre: {},
          language: {}
        }
      },
      musicFiles: musicFiles
    };
    
    await fs.writeFile(jsonOutput, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`✅ JSON 索引已生成：${jsonOutput}`);
    console.log('\n========================================');
    console.log('✅ 索引生成完成！');
    console.log('========================================');
    console.log('\n下一步：运行 enhance_tags.js 补充标签信息');
    
    return {
      success: true,
      jsonOutput,
      totalFiles: musicFiles.length,
      totalSize
    };
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 导出
module.exports = { generateMusicIndex };

// 运行
if (require.main === module) {
  generateMusicIndex().catch(error => {
    console.error('程序执行失败:', error);
    process.exit(1);
  });
}
