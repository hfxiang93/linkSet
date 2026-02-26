<!--
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 14:06:01
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 15:34:07
-->

# LinkSet

一个用 React + Vite 构建的个人链接聚合页，支持以“图标 + 名称”的卡片方式快速跳转，并提供新增、编辑、删除、搜索、导入/导出功能。

## 快速启动

- 安装依赖：`npm install`
- 本地开发：`npm run dev`（默认端口 5173）
- 生产构建：`npm run build`；预览构建结果：`npm run preview`

## 构建并加载为 Chrome 扩展

- 执行 `npm run build`，生成 `dist/`
- 打开 Chrome → `chrome://extensions/` → 打开右上角“开发者模式”
- 点击“加载已解压的扩展程序”，选择项目的 `dist/` 目录
- 新标签页将被 LinkSet 覆盖（manifest 使用 `chrome_url_overrides.newtab`）
- 若你之前装过其他覆盖新标签页的扩展，需暂时停用它以避免冲突

### 扩展权限

- `bookmarks`：用于一键读取浏览器书签树；在工具栏点击“从浏览器书签导入”
- `storage`：用于主题配置持久化（链接数据使用 IndexedDB）

## 页面功能

- 链接卡片展示：展示 favicon、名称，点击在新标签打开
- 搜索过滤：按名称/URL/标签模糊匹配
- 新增/编辑/删除：使用本地存储保存，无需后端
- 导出 JSON：一键导出所有链接为 `linkset.json`
- 导入 JSON：从本地 `linkset.json` 文件导入
- 导入浏览器书签 HTML：从浏览器导出的书签 HTML 批量解析为链接

## 迁移浏览器现有收藏到页面

方式一：一键导入浏览器书签（推荐）

- 在工具栏点击“从浏览器书签导入”，扩展将遍历书签树并保留文件夹层级
- 自动去重（按 URL），忽略非 http/https 链接

方式二：通过导出 HTML 文件导入

- Chrome/Edge：设置 → 书签 → 书签管理器 → 右上角“更多” → 导出书签
- Firefox：书签 → 管理书签 → 导入与备份 → 导出书签到 HTML
- Safari（macOS）：菜单栏 文件 → 导出书签…

2. 在 LinkSet 页面中点击“导入书签 HTML”，选择上一步导出的 HTML 文件，即可批量导入。

- 页面会自动去重（以 URL 为准），保留新的条目
- 若书签中包含非 http 地址会被忽略

## 代码结构

- 入口页面：[index.html](file:///Users/xhf/AI/linkSet/index.html)
- Vite 配置：[vite.config.ts](file:///Users/xhf/AI/linkSet/vite.config.ts)
- 应用入口：[main.tsx](file:///Users/xhf/AI/linkSet/src/main.tsx)
- 页面逻辑：[App.tsx](file:///Users/xhf/AI/linkSet/src/App.tsx)
- 链接卡片组件：[LinkCard.tsx](file:///Users/xhf/AI/linkSet/src/components/LinkCard.tsx)
- 链接编辑弹窗：[LinkEditor.tsx](file:///Users/xhf/AI/linkSet/src/components/LinkEditor.tsx)
- 本地存储/导入导出：[storage.ts](file:///Users/xhf/AI/linkSet/src/storage.ts)
- 类型定义：[types.ts](file:///Users/xhf/AI/linkSet/src/types.ts)
- 样式：[styles.css](file:///Users/xhf/AI/linkSet/src/styles.css)

## 设计说明

- Favicon：使用 Google S2 Favicon 服务按域名获取图标
- 数据持久化：浏览器 `localStorage`，键名 `linkset:links`
- 解析书签：解析导出 HTML 中的 `<a>` 标签

## 安全与隐私

- 数据仅存储在本地浏览器，不会上传到服务器
- 请勿导入包含敏感信息的链接列表
