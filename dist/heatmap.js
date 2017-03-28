(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.heatmap = factory());
}(this, (function () { 'use strict';

var f = function() {};

// 常量
var CONSTANT = {
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
var globalConfig = {
    outerContainer: null,                           // 外容器, 主要用来控制缩略图和热图之间的联动
    scale: 1,                                       // 缩放比
    radius: 40,                                     // 热力点半径
    height: 40,                                     // 注意力热图默认高度
    nodeBlur: 0.15,                                 // 节点辉光, 通过radialGradient的内圆radius * nodeBlur来实现.
    gradient: {                                     // 调色板
        0.25: "rgb(0, 0, 255)",
        0.55: "rgb(0, 255, 0)",
        0.85: "rgb(255, 255, 0)",
        1.0: "rgb(255, 0, 0)"
    },
    mini: {
        enabled: true,                              // 是否启用缩略图
        el: '',                                     // 缩略图容器的选择器, 类型: 字符串
        onDragStart: f,                             // 回调监听: 开始拖拽
        onDrag: f,                                  // 回调监听: 拖拽
        onDragEnd: f,                               // 回调监听: 结束拖拽
        onClick: f                                  // 回调监听: 点击
    }
};

// me.set("gradient", config.gradient || {
//         0.45: "rgb(0,0,255)",
//         0.55: "rgb(0,255,255)",
//         0.65: "rgb(0,255,0)",
//         0.95: "yellow",
//         1.0: "rgb(255,0,0)"
//     });    // default is the common blue to red gradient

// 缓存对象
var cache = {
    init: function () {
        if (!this.arr) this.arr = [];
    },
    get: function (idx) {
        // 避免0的情况, if条件判断麻烦
        return this.arr[idx - 1];
    },
    set: function (obj) {
        this.arr.push(obj);
        return obj;
    },
    remove: function(dk) {
        this.arr.forEach(function(obj, i, arr) {
            dk === obj && arr.splice(i, 1);
        });
    },
    index: function () {
        return this.arr.length + 1;
    },
    list: function() {
        return this.arr;
    }
};

// 工具类
var utils = {
    // 属性拷贝
    extend: function (mod, opt) {
        if (!opt) return mod;
        var conf = {};
        for (var attr in mod)
            conf[attr] = typeof opt[attr] !== "undefined" ? opt[attr] : mod[attr];
        return conf;
    },
    // 节流函数
    throttle: function (now) {
        var time = new Date().getTime();
        this.throttle = function (now) {
            if (now - time > CONSTANT.THROTTLE_TIME) {
                time = now;
                return true;
            }
            return false;
        };
        this.throttle(now);
    },
    getSliderCoordY: function (y, h) {
        var maxHeight = this.mini.canvas.height;
        if (y < 0) {
            return 0;
        }
        if (y + h > maxHeight) {
            return maxHeight - h;
        }
        return y;
    },
    getHeight: function (height) {
        if (height > this.opt._height) {
            return this.opt._height;
        }
        if (height < CONSTANT.HM_NODE_HEIGHT_MIN) {
            return CONSTANT.HM_NODE_HEIGHT_MIN;
        }
        return height;
    },
    getWeight: function (weight) {
        if (weight > CONSTANT.HM_NODE_WEIGHT_MAX) {
            return CONSTANT.HM_NODE_WEIGHT_MAX;
        }
        if (weight < CONSTANT.HM_NODE_WEIGHT_MIN) {
            return CONSTANT.HM_NODE_WEIGHT_MIN;
        }
        return weight;
    },
    getAlpha: function (weight) {
        var alpha = weight / CONSTANT.HM_NODE_WEIGHT_MAX;
        if (alpha > CONSTANT.HM_NODE_ALPHA_MAX) {
            return CONSTANT.HM_NODE_ALPHA_MAX;
        }
        if (alpha < CONSTANT.HM_NODE_ALPHA_MIN) {
            return CONSTANT.HM_NODE_ALPHA_MIN;
        }
        return alpha;
    },
    setBoundaries: function (x, y, radius, boundaries) {
        var rectX = x - radius,
            rectY = y - radius,
            rectW = x + radius,
            rectH = y + radius;
        if (rectX < boundaries.x) {
            boundaries.x = rectX;
        }
        if (rectY < boundaries.y) {
            boundaries.y = rectY;
        }
        if (rectW > boundaries.w) {
            boundaries.w = rectW;
        }
        if (rectH > boundaries.h) {
            boundaries.h = rectH;
        }
        return boundaries;
    },
    resetBoundaries: function() {
        // 重新初始边界
        this.boundaries = {
            x: CONSTANT.HM_BOUNDARIES_X_Y,
            y: CONSTANT.HM_BOUNDARIES_X_Y,
            w: 0,
            h: 0
        };
    },
    getBoundaries: function(boundaries, maxWidth, maxHeight) {
        if (boundaries.x < 0) {
            boundaries.x = 0;
        }
        if (boundaries.y < 0) {
            boundaries.y = 0;
        }
        if (boundaries.x + boundaries.w > maxWidth) {
            boundaries.w = maxWidth - boundaries.x;
        }
        if (boundaries.y + boundaries.h > maxHeight) {
            boundaries.h = maxHeight - boundaries.y;
        }
        return boundaries;
    }
};

/**
 * 展示对象 操作canvas展示
 * 描述: 因为每一个热图都是独立的canvas进行展示, view变身api通过apply, call来进行调用.
 */
var view = {
    // 调色板
    getColorPalette: function () {
        var gradientConfig = this.opt.gradient || globalConfig.gradient;
        var paletteCanvas = document.createElement('canvas');
        var paletteCtx = paletteCanvas.getContext('2d');

        paletteCanvas.width = 256;
        paletteCanvas.height = 1;

        var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
        for (var key in gradientConfig) {
            gradient.addColorStop(key, gradientConfig[key]);
        }

        paletteCtx.fillStyle = gradient;
        paletteCtx.fillRect(0, 0, 256, 1);

        return paletteCtx.getImageData(0, 0, 256, 1).data;
    },
    // 节点模板
    getNodeTemplate: function (radius, blurFactor) {
        var tplCanvas = document.createElement('canvas');
        var tplCtx = tplCanvas.getContext('2d');
        var x = radius;
        var y = radius;
        tplCanvas.width = tplCanvas.height = radius * 2;

        if (blurFactor == 1) {
            tplCtx.beginPath();
            tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
            tplCtx.fillStyle = 'rgba(0,0,0,1)';
            tplCtx.fill();
        } else {
            var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            tplCtx.fillStyle = gradient;
            tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
        }
        return tplCanvas;
    },
    // 注意力模板
    getAttentionTemplate: function(width, height) {
        var tplCanvas = document.createElement('canvas');
        var tplCtx = tplCanvas.getContext('2d');
        tplCanvas.width = width;
        tplCanvas.height = height;
        var midW = Math.round(width / 2),
            midH = Math.round(height / 2);
        // 中间 到 上
        var gradient1 = tplCtx.createLinearGradient(midW, midH, midW, 0);
        gradient1.addColorStop(0, 'rgba(0,0,0,1)');
        gradient1.addColorStop(1, 'rgba(0,0,0,0)');
        tplCtx.fillStyle = gradient1;
        tplCtx.fillRect(0, 0, width, midH);
        // 中间 到 下
        var gradient2 = tplCtx.createLinearGradient(midW, midH, midW, height);
        gradient2.addColorStop(0, 'rgba(0,0,0,1)');
        gradient2.addColorStop(1, 'rgba(0,0,0,0)');
        tplCtx.fillStyle = gradient2;
        tplCtx.fillRect(0, midH, width, midH);
        return tplCanvas;
    },
    // 节点上色
    colorize: function (boundaries) {
        var colorPalette = this.colorPalette;
        boundaries = boundaries || utils.getBoundaries(this.boundaries, this.opt._width, this.opt._height);
        // 取得图像
        var img = this.shadowCtx.getImageData(boundaries.x, boundaries.y, boundaries.w, boundaries.h);
        var imgData = img.data;
        var len = imgData.length;
        // 上色
        for (var i = 3; i < len; i += 4) {
            var alpha = imgData[i];
            /**
             * offset = alpha * 4
             * 是因为canvas中图像是Uint8ClampedArray数组
             * 每个像素由数组中连续排列的4个数组值组成, 分别代表rgba
             */
            var offset = alpha * 4;
            if (offset) {
                imgData[i - 3] = colorPalette[offset];      // red
                imgData[i - 2] = colorPalette[offset + 1];  // green
                imgData[i - 1] = colorPalette[offset + 2];  // blue
                imgData[i] = alpha;                         // alpha
            }
        }
        this.ctx.putImageData(img, boundaries.x, boundaries.y);
    },
    // 清除
    clear: function () {
        this.shadowCtx.clearRect(0, 0, this.opt._width, this.opt._height);
        this.ctx.clearRect(0, 0, this.opt._width, this.opt._height);
    },
    // 渲染
    render: function () {
        var tpl, self = this,
            shadowCtx = this.shadowCtx,
            nodeBlur = this.opt.nodeBlur,
            nodes = this.data.nodes,
            attention = this.data.attention;

        if (Array.isArray(nodes) && nodes.length > 0) {
            nodes.forEach(function(node) {
                // 缓存模板
                if (!self._templates[node.radius]) {
                    self._templates[node.radius] = tpl = view.getNodeTemplate(node.radius, nodeBlur);
                } else {
                    tpl = self._templates[node.radius];
                }
                // 设置透明度
                shadowCtx.globalAlpha = node.alpha;
                // 绘制节点
                shadowCtx.drawImage(tpl, node.x - node.radius, node.y - node.radius);
            });
            // 给节点上色
            view.colorize.call(this);
        }

        if (Array.isArray(attention) && attention.length > 0) {
            attention.forEach(function(node) {
                tpl = view.getAttentionTemplate(self.opt._width, node.height);
                shadowCtx.globalAlpha = node.alpha;
                shadowCtx.drawImage(tpl, 0, node.y);
            });
            // 给节点上色
            view.colorize.call(this, {x: 0, y: 0, w: this.opt._width, h: this.opt._height});
        }
    },
    // 设置样式
    setContainerStyle: function () {
        var opt = this.opt,
            canvas = this.canvas,
            shadowCanvas = this.shadowCanvas,
            container = this.container;
        canvas.classList.add(CONSTANT.HM_CANVAS);
        var computed = getComputedStyle(container) || {};
        opt._width = canvas.width = shadowCanvas.width = (computed.width.replace(/px/, ''));
        opt._height = canvas.height = shadowCanvas.height = (computed.height.replace(/px/, ''));
    },
    // 初始化
    init: function () {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        this.colorPalette = view.getColorPalette.call(this);
        // 根据节点半径, 缓存节点模板
        this._templates = {};
        view.setContainerStyle.call(this);
        this.container.classList.add(CONSTANT.HM_CONTAINER);
        this.container.appendChild(this.canvas);
    }
};

/**
 * 展示对象 操作缩略图展示
 * 描述: 因为每一个缩略图都是独立的canvas进行展示, view变身api通过apply, call来进行调用.
 */
var thumbnail = {
    init: function() {
        var mini = this.mini,
            num = this._number,
            miniOption = this.opt.mini;
        if (miniOption.enabled && miniOption.el) {
            var fragment = document.createDocumentFragment();
            mini.container = document.querySelector(miniOption.el);
            mini.canvas = document.createElement('canvas');
            mini.ctx = mini.canvas.getContext('2d');
            thumbnail.createSlider(mini, fragment, num);
            thumbnail.createMask(mini.mask, fragment);
            thumbnail.setContainerStyle(mini, num);
            thumbnail.setSliderHeight.call(this);
            mini.container.appendChild(fragment);
        }
    },
    setContainerStyle: function(mini, num) {
        // 设置宽高样式
        var computed = getComputedStyle(mini.container) || {};
        mini.canvas.width = (computed.width.replace(/px/, ''));
        mini.canvas.height = (computed.height.replace(/px/, ''));
        mini.canvas.classList.add(CONSTANT.HM_MINI_CANVAS);
        mini.container.classList.add(CONSTANT.HM_MINI_CONTAINER);
        mini.container.setAttribute(CONSTANT.HM_ID, num);
    },
    setSliderHeight() {
        var mini = this.mini,
            outer = this.opt.outerContainer,
            outerDom = document.querySelector(outer);
        if (outerDom) {
            var computed = getComputedStyle(outerDom) || {};
            var outerHeight = (computed.height.replace(/px/, ''));
            // 外容器的高度即为分屏的显示高度
            var height =  outerHeight / this.canvas.height * mini.canvas.height;
            thumbnail.move.call(this, {y: 0, h: height});
        }
    },
    createSlider: function(mini, fragment, num) {
        var slider = mini.slider = document.createElement('div');
        slider.setAttribute(CONSTANT.HM_ID, num);
        slider.classList.add(CONSTANT.HM_MINI_SLIDER);
        fragment.appendChild(slider);
    },
    createMask: function(mask, fragment) {
        var maskTop = mask.top = document.createElement('div'),
            maskRight = mask.right = document.createElement('div'),
            maskBottom = mask.bottom = document.createElement('div'),
            maskLeft = mask.left = document.createElement('div');
        maskTop.className = CONSTANT.HM_MINI_MASK + ' ' + CONSTANT.HM_MINI_MASK_TOP;
        maskRight.className = CONSTANT.HM_MINI_MASK + ' ' + CONSTANT.HM_MINI_MASK_RIGHT;
        maskBottom.className = CONSTANT.HM_MINI_MASK + ' ' + CONSTANT.HM_MINI_MASK_BOTTOM;
        maskLeft.className = CONSTANT.HM_MINI_MASK + ' ' + CONSTANT.HM_MINI_MASK_LEFT;
        fragment.appendChild(maskTop);
        fragment.appendChild(maskRight);
        fragment.appendChild(maskBottom);
        fragment.appendChild(maskLeft);
    },
    move: function(coord) {
        if (!this && !this.mini) return;
        var mini = this.mini;
        // 滑块
        mini.slider.style.cssText = 'height:'+coord.h+ 'px;top:' + coord.y + 'px';
        // 遮罩
        mini.mask.top.style.cssText = 'height:' + coord.y + 'px';
        mini.mask.right.style.cssText = 'height:' +coord.h + 'px;top:' + coord.y + 'px';
        mini.mask.bottom.style.cssText = 'top:' + (coord.y + coord.h) + 'px';
        mini.mask.left.style.cssText = 'height:' + coord.h + 'px;top:' + coord.y + 'px';
    },
    clear: function () {
        this.mini.ctx.clearRect(0, 0, this.opt._width, this.opt._height);
    },
    render: function() {
        var mini = this.mini;
        // 生成缩略图
        mini.ctx.drawImage(this.canvas, 0, 0, this.opt._width, this.opt._height,
            0, 0, mini.canvas.width, mini.canvas.height); // 拉伸图片
        // 插入缩略图
        mini.container.appendChild(mini.canvas);
    }
};

// 事件处理对象
var handleEvent = {
    init: function (isbind) {
        if (this.isbind) return;
        this.isbind = isbind;
        this.globalUnbind();
        this.globalBind();
    },
    globalBind: function () {
        document.addEventListener('mousedown', this.mouseDown, false);
        document.addEventListener('mousemove', this.mouseMove, false);
        document.addEventListener('mouseup', this.mouseUp, false);
        this.isbind = true;
    },
    globalUnbind: function () {
        document.removeEventListener('mousedown', this.mouseDown, false);
        document.removeEventListener('mousemove', this.mouseMove, false);
        document.removeEventListener('mouseup', this.mouseUp, false);
        this.isbind = false;
    },
    mouseDown: function (event) {
        // 点击滑块
        var slider = event.target;
        if (slider.classList.contains(CONSTANT.HM_MINI_SLIDER)) {
            document.body.classList.add(CONSTANT.HM_USER_SELECT);
            handleEvent.isDrag = true;
            handleEvent.heatmap = cache.get(slider.getAttribute(CONSTANT.HM_ID) * 1);
            handleEvent.offsetX = event.offsetX || 0;
            handleEvent.offsetY = event.offsetY || 0;
            // 回调函数
            handleEvent.heatmap.opt.onDragStart.call(handleEvent.heatmap, event);
        }
    },
    mouseMove: function (event) {
        // 拖拽状态, 拖拽元素
        if (!handleEvent.isDrag) return;
        // 函数节流
        if (!utils.throttle(new Date().getTime())) return;
        // 计算坐标移动滑块
        var heatmap = handleEvent.heatmap,
            offset = heatmap.mini.container.getBoundingClientRect();
        var y = event.pageY - handleEvent.offsetY - offset.top;
        var computed = getComputedStyle(heatmap.mini.slider) || {};
        var h = computed.height.replace(/px/, '')*1;
        thumbnail.move.call(heatmap, {
            y: utils.getSliderCoordY.call(heatmap, y, h),
            h: h
        });
        // 回调函数(联动通过回调函数来解决)
        handleEvent.heatmap.opt.onDrag.call(handleEvent.heatmap, event);
    },
    mouseUp: function (event) {
        document.body.classList.remove(CONSTANT.HM_USER_SELECT);
        delete handleEvent.heatmap;
        delete handleEvent.isDrag;
        delete handleEvent.offsetX;
        delete handleEvent.offsetY;
        // 回调函数(联动通过回调函数来解决)
        handleEvent.heatmap.opt.onDragEnd.call(handleEvent.heatmap, event);
    }
};

function HeatMap(options, container, originData, number) {
    this.init(options, container, originData, number);
}

HeatMap.prototype = {
    constructor: HeatMap,
    init: function(options, container, originData, number) {
        this._number = number;                          // 编号
        this.opt = utils.extend(globalConfig, options); // 配置项
        this.container = container;                     // 容器DOM
        utils.resetBoundaries.call(this);               // 重置绘制边界
        view.init.call(this);                           // 初始渲染的视图层canvas
        this.data = this.setData(originData);           // 渲染数据
        if (this.opt.mini.enabled) {
            this.mini = {
                ctx: null,
                canvas: null,
                container: null,
                slider: null,
                mask: {
                    top: null,
                    right: null,
                    bottom: null,
                    left: null
                }
            };
            thumbnail.init.call(this);                  // 初始化缩略图
        }
        this.draw();
    },
    destroy: function() {
        // 基础变量
        delete this._number;
        delete this.opt;
        delete this.container;
        delete this.originData;
        delete this.data;
        // 绘制变量
        delete this.canvas;
        delete this.ctx;
        delete this.shadowCanvas;
        delete this.shadowCtx;
        delete this.boundaries;
        delete this.colorPalette;
        delete this._templates;
        // 缩略图
        delete this.mini;
    },
    setData: function (originData) {
        var self = this,
            data = {nodes: [], lines: [], attention: []};
        if (!originData) return data;
        this.originData = originData;                   // 缓存原始数据
        if (Array.isArray(originData.nodes)) {
            originData.nodes.forEach(function (node) {
                data.nodes.push({
                    x: node.x,                              // 坐标: x
                    y: node.y,                              // 坐标: y
                    weight: utils.getWeight(node.weight),   // 权重: 0 - 255
                    alpha: utils.getAlpha(node.weight),     // 透明度: 0 - 1
                    radius: node.radius                     // 半径: 默认 40
                });
                // 设置边界
                utils.setBoundaries(node.x, node.y, node.radius, self.boundaries);
            });
        }
        if (Array.isArray(originData.lines)) {}
        if (Array.isArray(originData.attention)) {
            originData.attention.forEach(function (node) {
                data.attention.push({
                    y: node.y,                                       // 坐标: y
                    height: utils.getHeight.call(self, node.height), // 高度: 默认 40
                    weight: utils.getWeight(node.weight),            // 权重: 0 - 255
                    alpha: utils.getAlpha(node.weight),              // 透明度: 0 - 1
                });
                // 设置边界
                // utils.setBoundaries(node.x, node.y, node.radius, self.boundaries);
            });
        }
        return data;
    },
    load: function(data) {
        this.setData(data);
        this.draw();
    },
    draw: function() {
        this.clear();
        view.render.call(this);        // 画布
        thumbnail.render.call(this);   // 缩略图
        utils.resetBoundaries.call(this);
    },
    clear: function() {
        view.clear.call(this);
        thumbnail.clear.call(this);
    }
};

var heatmap = {
    version: "1.0.2",
    instance: function (options, container, originData) {
        if (container && !container.hasAttribute(CONSTANT.HM_ID)) {
            // 初始化监听
            handleEvent.init(true, document.body);
            // 初始化缓存
            cache.init();
            // 初始化实例
            var index = cache.index();
            container.setAttribute(CONSTANT.HM_ID, index);
            return cache.set(new HeatMap(options, container, originData, index));
        }
    },
    destroy: function (obj) {
        if (obj) {
            obj.container.removeAttribute(CONSTANT.HM_ID);
            cache.remove(obj);
            obj.destroy();
            obj = null;
        }
        if (cache.arr == 0) {
            handleEvent.globalUnbind();
        }
    }
};

return heatmap;

})));
