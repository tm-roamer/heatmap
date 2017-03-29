"use strict";

var f = function() {};

// 常量
export var CONSTANT = {
    THROTTLE_TIME: 14,                              // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
    HM_BOUNDARIES_X_Y: 1000000,                     // 图像绘制边界的预设值, 反复计算递减
    HM_NODE_WEIGHT_MAX: 255,                        // 绘制节点的weight权重最大值
    HM_NODE_WEIGHT_MIN: 0,                          // 绘制节点的weight权重最小值
    HM_NODE_HEIGHT_MIN: 1,                          // 绘制注意力热图的节点最小高度
    HM_NODE_ALPHA_MAX: 1,                           // 绘制节点的alpha透明度最大值
    HM_NODE_ALPHA_MIN: 0.01,                        // 绘制节点的alpha透明度最小值
    HM_USER_SELECT: "hm-user-select",               // 拖拽进行中, 在body标签动态绑定, 防止文本选中
    HM_CONTAINER: 'hm-container',                   // 容器classname
    HM_CANVAS: 'hm-canvas',                         // 画布canvas的classname
    HM_MINI_CONTAINER: 'hm-mini-container',         // 缩略图容器classname
    HM_MINI_SLIDER: 'hm-mini-slider',               // 缩略图滑块classname
    HM_MINI_MASK: 'hm-mini-mask',                   // 缩略图遮罩classname
    HM_MINI_MASK_TOP: 'hm-mini-mask-top',           // 缩略图上遮罩classname
    HM_MINI_MASK_RIGHT: 'hm-mini-mask-right',       // 缩略图右遮罩classname
    HM_MINI_MASK_BOTTOM: 'hm-mini-mask-bottom',     // 缩略图下遮罩classname
    HM_MINI_MASK_LEFT: 'hm-mini-mask-left',         // 缩略图左遮罩classname
    HM_MINI_CANVAS: 'hm-mini-canvas',               // 缩略图画布canvas的classname
    HM_ID: 'data-hm-id'                             // 标识id
};

// 配置项
export var globalConfig = {
    container: null,                                // 画布容器
    outerContainer: null,                           // 画布容器的容器, 主要用来控制缩略图和热图之间的联动
    scale: 1,                                       // 缩放比
    radius: 40,                                     // 热力点半径
    height: 40,                                     // 注意力热图默认高度
    nodeBlur: 0.15,                                 // 节点辉光, 通过radialGradient的内圆radius * nodeBlur来实现.
    gradient: {                                     // 调色板
        0.25: "rgb(0, 0, 255)",
        0.55: "rgb(0, 255, 0)",
        0.85: "rgb(255, 255, 0)",
        1.0: "rgb(255, 0, 0)"
//      0.45: "rgb(0,0,255)",
//      0.55: "rgb(0,255,255)",
//      0.65: "rgb(0,255,0)",
//      0.95: "yellow",
//      1.0: "rgb(255,0,0)"
    },
    pagination: {
        currentPage: 1,                             // 当前第几分屏
        pageSize: 10000                             // 每个分屏高度多少像素
    },
    mini: {
        sliderMinHeight: 30,                        // 滑块的最小高度
        sliderPaddingTop: 2,                        // 滑块滑到顶部的空隙距离
        sliderPaddingBottom: 2,                     // 滑块滑到底部的空隙距离
        enabled: true,                              // 是否启用缩略图
        el: '',                                     // 缩略图容器的选择器, 类型: 字符串
        onDragStart: f,                             // 回调监听: 开始拖拽
        onDrag: f,                                  // 回调监听: 拖拽
        onDragEnd: f,                               // 回调监听: 结束拖拽
        onClick: f                                  // 回调监听: 点击
    }
};