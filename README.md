# 华读 Hua Reader

一款以沉浸式阅读为核心的 Android RSS 阅读器，帮助用户通过广泛阅读打破认知局限。

## 功能特性

- **120+ 精选源**：覆盖财经、科技、AI、开发者、科学、深度思考等 11 个话题，国内国际各半
- **双模式阅读**：提取模式（纯净排版）+ 原文模式（去广告），一键切换
- **中英双向翻译**：提取模式下逐段对照翻译，自动检测语言
- **侧边抽屉导航**：任意页面左滑打开，话题筛选 + 功能入口
- **滑动操作**：右滑标记已读，左滑收藏
- **3026 路由搜索**：搜索 RSSHub 全量路由，一键添加
- **负载均衡**：4 个 RSSHub 节点自动调度，故障转移
- **主题系统**：6 种主题色 + 亮色/暗色/纯黑 AMOLED 模式
- **OPML 导入导出**：兼容其他 RSS 阅读器
- **自用优先**：自建 RSSHub 实例 + 原生 RSS 混合

## 技术栈

- React Native (Expo SDK 56)
- React Native Paper (Material Design 3)
- React Navigation (Drawer + Stack)
- expo-sqlite (本地存储)
- react-native-webview (文章渲染)
- fast-xml-parser (RSS/Atom 解析)

## 安装

从 [GitHub Releases](https://github.com/linghualive/hua-reader/releases/latest) 下载最新 APK 安装。

## 开发

```bash
git clone https://github.com/linghualive/hua-reader.git
cd hua-reader
npm install
npx expo start
```

## 构建 APK

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

APK 输出路径：`android/app/build/outputs/apk/release/app-release.apk`

## License

MIT
