# Loon Scripts

一个简约风格的 Loon 插件订阅页面，支持一键复制插件地址。

## 🚀 功能特性

- 📋 **一键复制**：点击卡片即可复制插件订阅地址
- 🏷️ **分类管理**：插件按类别分组，便于查找
- 🌙 **暗色主题**：护眼的深色界面设计
- 📱 **响应式布局**：完美适配手机和桌面端
- ⚡ **Cloudflare Pages**：开箱即用的部署配置

## 📁 项目结构

```
Loon-Scripts/
├── index.html          # 主页面
├── plugins.json        # 插件配置文件（核心）
├── _headers            # Cloudflare Pages HTTP 头配置
├── _redirects          # Cloudflare Pages 重定向配置
├── wrangler.toml       # Cloudflare Wrangler 配置
├── assets/
│   ├── styles.css      # 样式文件
│   └── scripts.js      # JavaScript 逻辑
└── plugins/
    ├── sms/            # 短信相关插件
    │   └── sms-forward.plugin
    ├── tools/          # 实用工具插件
    └── ads/            # 去广告插件
```

## 📝 添加新插件

### 1. 将插件文件放入对应分类文件夹

```bash
plugins/
├── sms/           # 短信相关
├── tools/         # 实用工具
└── ads/           # 去广告
```

### 2. 在 `plugins.json` 中添加插件信息

```json
{
  "plugins": [
    {
      "id": "my-plugin",
      "name": "插件名称",
      "description": "插件描述",
      "author": "作者",
      "icon": "图标URL（可选）",
      "category": "sms",
      "path": "plugins/sms/my-plugin.plugin",
      "version": "1.0.0",
      "loonVersion": "3.2.1(734)",
      "tags": ["标签1", "标签2"],
      "updated": "2024-12-24"
    }
  ]
}
```

### 3. 添加新分类（可选）

```json
{
  "categories": [
    {
      "id": "new-category",
      "name": "新分类",
      "icon": "tool",
      "description": "分类描述"
    }
  ]
}
```

可用图标：`message-circle`, `tool`, `shield`, `default`

## 🌐 部署到 Cloudflare Pages

### 方式一：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 选择 **Connect to Git**
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: (留空)
   - **Build output directory**: `/`
6. 点击 **Save and Deploy**

### 方式二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy . --project-name=loon-scripts
```

## 🔗 使用方法

1. 访问部署后的页面（例如：`https://loon-scripts.pages.dev`）
2. 找到需要的插件
3. 点击插件卡片，地址自动复制到剪贴板
4. 打开 Loon → 配置 → 插件 → 添加
5. 粘贴地址并确认

## 📦 本地开发

由于这是纯静态页面，你可以使用任何静态服务器：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js (需要安装 serve)
npx serve .

# 使用 VS Code Live Server 插件
# 右键 index.html → Open with Live Server
```

## 🛠️ 自定义配置

### 修改站点标题

编辑 `index.html` 中的 `<title>` 和 `<h1>` 标签。

### 修改主题颜色

编辑 `assets/styles.css` 中的 CSS 变量：

```css
:root {
    --color-accent: #6366f1;      /* 主题色 */
    --color-accent-light: #818cf8; /* 浅色主题色 */
    --gradient-primary: linear-gradient(...); /* 渐变色 */
}
```

### 修改 GitHub 链接

编辑 `index.html` 中的 `githubLink` 链接地址。

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
