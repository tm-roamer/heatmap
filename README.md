# heatmap
heatmap.js is a plugin for canvas chart 一个基于canvas的绘制热图插件

### 概述
工作中我们使用[heatmap.js](https://www.patrick-wied.at/static/heatmapjs/)这个热图绘制工具,然后业务的风向变了, 
需要缩略图, 需要按需加载, 需要注意力热图等等功能, 它以不再适用了, 然后就阅读它的源码学习它, 
套用它的绘制原理, 然后重写了一套代码适应需求变化.

### 预览图

<img src="https://github.com/tm-roamer/heatmap/blob/master/doc/click.png" width="600" height="300" >
<img src="https://github.com/tm-roamer/heatmap/blob/master/doc/attention.png" width="600" height="225" >

### 安装使用说明

    npm install
    npm run watch
    npm run build

### 渲染原理

    1. 为什么要分屏加载 ?
        win10下的火狐浏览器canvas图层最高支持32766像素，win10下谷歌浏览器最高canvas图层支持32767像素。
 
### 更新日志

#### v1.0.4
1. 支持分屏加载超长尺寸热图, 突破canvas最大尺寸限制

#### v1.0.3
1. 修正缩略图滑块的点击位置

#### v1.0.2
1. 缩略图支持拖拽滑块, 联动画布.
2. 缩略图支持点击联动画布.

#### v1.0.1
1. 加入注意力热图
2. 加入缩略图

#### v1.0.0
1. 加入点击热图

### 版权
MIT