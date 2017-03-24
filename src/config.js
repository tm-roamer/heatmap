"use strict";

// 常量
export var CONSTANT = {
    THROTTLE_TIME: 14,                              // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
    HM_BOUNDARIES_X_Y: 1000000,                     // 图像绘制边界的预设值, 反复计算递减
    HM_NODE_WEIGHT_MAX: 255,                        // 绘制节点的weight权重最大值
    HM_NODE_WEIGHT_MIN: 0,                          // 绘制节点的weight权重最小值
    HM_NODE_ALPHA_MAX: 1,                           // 绘制节点的alpha透明度最大值
    HM_NODE_ALPHA_MIN: 0.01,                        // 绘制节点的alpha透明度最小值
    HM_USER_SELECT: "hm-user-select",               // 拖拽进行中, 在body标签动态绑定, 防止文本选中
    HM_CONTAINER: 'hm-container',                   // 容器classname
    HM_CANVAS: 'hm-canvas',                         // 画布canvas的classname
    HM_ID: 'data-hm-id'                             // 标识id
};

// 配置项
export var globalConfig = {
    backgroundColor: '',                            // canvas背景色, 默认 ''
    scale: 1,                                       // 缩放比
    radius: 40,                                     // 热力点半径
    nodeBlur: 0.15,                                 // 节点辉光, 通过radialGradient的内圆radius * nodeBlur来实现.
    gradient: {                                     // 热力点渐变
        0.25: "rgb(0, 0, 255)",
        0.55: "rgb(0, 255, 0)",
        0.85: "rgb(255, 255, 0)",
        1.0: "rgb(255, 0, 0)"
    }
};