# 3dMap-vue

一个基于 Vue 3 + Three.js 构建的浙江省 3D 地图可视化项目。

本项目为对 [`3d-geoMap`](https://github.com/xiaogua-bushigua/3d-geoMap) 的学习复现，并结合个人需求进行了重构和功能扩展。

## 项目预览

![预览图 1](./assets/image-20260326034307143.png)![动画](./assets/动画-1774468292222-1.gif)
![预览图 2](./assets/image-20260326034322284.png)

## 功能特性

- 浙江省 3D 挤出地图展示
- GeoJSON 数据解析与墨卡托投影转换（d3）
- 地图区域点击交互与信息展示面板
- 雷达扫描背景特效
- 城市间飞线动画
- Matcap 侧面材质增强质感
- 加载进度反馈

## 技术栈

- Vite
- Vue 3
- JavaScript
- Three.js
- d3.js（墨卡托投影）
- GeoJSON 处理（阿里地理工具 / 行政区数据处理流程）

## 快速开始

### 环境要求

- Node.js 18+（推荐）
- npm 9+（或兼容的包管理器）

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 打包构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 目录结构

```text
src/
  core/           # Three 引擎、地图模块、资源管理
  views/          # 页面级 Vue 文件
  components/     # 可复用组件
  config/         # 地图与视觉配置
  utils/          # 加载器与工具函数
public/data/      # JSON/HDR/纹理等静态资源
```

## 已完成

- [x] 雷达扫描背景
- [x] 网格替换为科技感底板
- [x] HDR 加载流程优化
- [x] 项目结构重构
- [x] Loading 进度条
- [x] 公共函数与变量抽象
- [x] 性能优化
- [x] Matcap 侧面材质
- [x] 交互弹窗展示
- [x] 飞线效果

## 致谢

- 原项目与灵感来源：[`xiaogua-bushigua/3d-geoMap`](https://github.com/xiaogua-bushigua/3d-geoMap)

