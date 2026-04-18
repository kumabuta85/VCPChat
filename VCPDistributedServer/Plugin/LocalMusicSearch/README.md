# LocalMusicSearch 插件

本地音乐搜索工具 - 根据情绪、场景、风格等标签快速找到合适的歌曲

## 📋 功能特性

### **阶段一：生成索引**
- ✅ 自动扫描 MP3 目录
- ✅ 提取歌手和歌曲信息
- ✅ 智能标签（情绪、场景、风格、语言）
- ✅ 生成 `music_index.json`

### **阶段二：搜索工具**
- ✅ 按情绪标签搜索（欢快、伤感、浪漫等）
- ✅ 按场景标签搜索（开车、运动、睡眠等）
- ✅ 按风格标签搜索（流行、摇滚、古典等）
- ✅ 按语言搜索（中文、英文、日文、韩文）
- ✅ 随机推荐
- ✅ Agent 直接调用

## 📁 文件说明

| 文件 | 说明 | 用途 |
|------|------|------|
| `generate_index.js` | 索引生成器 | 扫描 MP3，生成基础索引 |
| `enhance_tags.js` | 标签增强器 | 补充 mood/scene/genre 等标签 |
| `search.js` | 搜索工具 | **Agent 调用的核心工具** |
| `update.bat` | 一键更新 | 执行完整更新流程 |
| `plugin-manifest.json` | 插件配置 | VCPChat 插件描述 |
| `output/music_index.json` | 音乐索引 | 带标签的歌曲数据库 |

## 🚀 快速开始

### **步骤 1：生成索引**
双击运行或在命令行执行：
```bash
cd F:\VCP\VCPChat-main\VCPDistributedServer\Plugin\LocalMusicSearch
.\update.bat
```

或分步执行：
```bash
# 1. 生成基础索引
node generate_index.js

# 2. 增强标签（规则模式，快速）
node enhance_tags.js

# 或（API 模式，准确但慢）
node enhance_tags.js --api
```

### **步骤 2：Agent 调用搜索工具**

```javascript
const { search, getTagStats } = require('./search.js');

// 示例 1：找欢快的歌
const happySongs = await search({ mood: '欢快', limit: 10 });

// 示例 2：找适合开车的歌
const drivingSongs = await search({ scene: '开车', limit: 10 });

// 示例 3：找浪漫的中文流行歌
const romanticSongs = await search({ 
  mood: '浪漫',
  genre: '流行',
  language: '中文',
  limit: 5 
});

// 示例 4：获取所有可用标签
const stats = await getTagStats();
console.log(stats);
```

## 🔧 配置

在 `plugin-manifest.json` 中修改：

```json
{
  "config": {
    "music_directory": "E:\\本地音乐\\MP3",
    "output_directory": "F:\\VCP\\VCPChat-main\\VCPDistributedServer\\Plugin\\LocalMusicSearch\\output"
  }
}
```

## 📊 标签系统

### **情绪标签（mood）**
- 欢快、伤感、浪漫、励志、平静、激情、怀旧、孤独

### **场景标签（scene）**
- 开车、运动、学习、睡眠、旅行、派对、恋爱

### **风格标签（genre）**
- 流行、摇滚、民谣、电子、古典、爵士、说唱、轻音乐、影视原声

### **语言标签（language）**
- 中文、英文、日文、韩文

### **年代（era）**
- 1980s, 1990s, 2000s, 2010s, 2020s

## 🎯 Agent 使用示例

### **场景 1：用户说"我想听点欢快的歌"**
```javascript
const result = await search({ mood: '欢快', limit: 10 });
// 返回 10 首欢快的歌曲
```

### **场景 2：用户说"推荐几首适合开车的歌"**
```javascript
const result = await search({ scene: '开车', limit: 10 });
// 返回 10 首适合开车的歌曲
```

### **场景 3：用户说"我想听周杰伦的歌"**
```javascript
const result = await search({ artist: '周杰伦', limit: 10 });
// 返回周杰伦的歌曲
```

### **场景 4：用户说"来点浪漫的中文情歌"**
```javascript
const result = await search({ 
  mood: '浪漫',
  language: '中文',
  limit: 10 
});
// 返回浪漫的中文歌曲
```

## 🔍 搜索 API 详解

### **search(options)**

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| mood | string\|string[] | 情绪标签 | `'欢快'` 或 `['欢快', '浪漫']` |
| scene | string\|string[] | 场景标签 | `'开车'` |
| genre | string\|string[] | 风格标签 | `'流行'` |
| language | string\|string[] | 语言标签 | `'中文'` |
| artist | string | 歌手（模糊匹配） | `'周杰伦'` |
| title | string | 歌曲名（模糊匹配） | `'告白'` |
| era | string | 年代 | `'2010s'` |
| limit | number | 返回数量 | `10` |

### **返回值**
```json
{
  "success": true,
  "total": 50,
  "limit": 10,
  "songs": [
    {
      "id": 1,
      "artist": "Air Supply",
      "title": "All out of Love",
      "fileName": "Air Supply - All out of Love.mp3",
      "path": "E:\\本地音乐\\MP3\\...",
      "size": 10485760,
      "sizeFormatted": "10 MB",
      "tags": {
        "mood": ["浪漫", "伤感"],
        "scene": ["恋爱"],
        "genre": ["流行"],
        "language": ["英文"]
      },
      "searchKeys": "air supply all out of love 浪漫 伤感 恋爱 流行"
    }
  ],
  "query": { "mood": "浪漫", "limit": 10 }
}
```

## 📈 测试工具

运行内置测试：
```bash
node search.js
```

## 💡 最佳实践

1. **定期更新索引**：
   - 添加新歌后运行 `update.bat`
   - 建议每周更新一次

2. **标签模式选择**：
   - 日常：规则模式（快速）
   - 重要歌曲：API 模式（准确）

3. **搜索优化**：
   - 组合多个标签提高准确度
   - 使用 `limit` 控制返回数量

## 📝 更新日志

- **v1.0.0** (2026-04-16)
  - 初始版本
  - 支持标签搜索
  - Agent 集成

## 📄 License

MIT
