(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.heatmap = factory());
}(this, (function () { 'use strict';

// 常量
var CONSTANT = {
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
var globalConfig = {
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
    getPointTemplate: function (radius, blurFactor) {
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
    // 节点上色
    colorize: function () {
        var colorPalette = this.colorPalette,
            boundaries = utils.getBoundaries(this.boundaries, this.opt._width, this.opt._height);
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
        // img.data = imgData;
        this.ctx.putImageData(img, boundaries.x, boundaries.y);
    },
    clear: function () {
        this.shadowCtx.clearRect(0, 0, this.opt._width, this.opt._height);
        this.ctx.clearRect(0, 0, this.opt._width, this.opt._height);
    },
    render: function () {
        var self = this,
            nodes = this.data.nodes;
        if (Array.isArray(nodes)) {
            var tpl,
                shadowCtx = this.shadowCtx,
                nodeBlur = this.opt.nodeBlur;
            nodes.forEach(function(node) {
                // 缓存模板
                if (!self._templates[node.radius]) {
                    self._templates[node.radius] = tpl = view.getPointTemplate(node.radius, nodeBlur);
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
    },
    setContainerStyle: function () {
        var opt = this.opt,
            canvas = this.canvas,
            shadowCanvas = this.shadowCanvas,
            container = this.container;

        canvas.classList.add(CONSTANT.HM_CANVAS);
        canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';
        container.style.position = 'relative';

        var computed = getComputedStyle(container) || {};
        opt._width = canvas.width = shadowCanvas.width = (computed.width.replace(/px/, ''));
        opt._height = canvas.height = shadowCanvas.height = (computed.height.replace(/px/, ''));

        if (opt.backgroundColor) {
            canvas.style.backgroundColor = opt.backgroundColor;
        }
    },
    init: function () {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        this.colorPalette = view.getColorPalette.call(this);
        // 根据节点半径, 缓存节点模板
        this._templates = {};
        view.setContainerStyle.call(this);
        this.container.appendChild(this.canvas);
    },
    searchUp: function (node, className) {
        if (!node || node === document.body || node === document) return undefined;   // 向上递归到顶就停
        if (node.classList.contains(className)) return node;
        return this.searchUp(node.parentNode, className);
    },
    getOffset: function (node, offset, parent) {
        if (!parent)
            return node.getBoundingClientRect();
        offset = offset || {top: 0, left: 0};
        if (node === null || node === parent) return offset;
        offset.top += node.offsetTop;
        offset.left += node.offsetLeft;
        return this.getOffset(node.offsetParent, offset, parent);
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

    },
    mouseMove: function (event) {

    },
    mouseUp: function (event) {

    },
    isDrag: function(event) {

    }
};

function HeatMap(options, container, originData, number) {
    this.init(options, container, originData, number);
}

HeatMap.prototype = {
    constructor: HeatMap,
    init: function(options, container, originData, number) {
        this.number = number;                           // 拖拽对象的编号
        this.autoIncrement = 0;                         // 节点的自增主键
        this.opt = utils.extend(globalConfig, options); // 配置项
        this.container = container;                     // 容器DOM
        this.boundaries = {                             // 绘制边界
            x: CONSTANT.HM_BOUNDARIES_X_Y,
            y: CONSTANT.HM_BOUNDARIES_X_Y,
            w: 0,
            h: 0
        };
        view.init.call(this);                           // 初始渲染的视图层canvas
        this.data = this.setData(originData);           // 渲染数据
        this.draw();
    },
    destroy: function() {
        // 基础变量
        delete this.number;
        delete this.autoIncrement;
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
    },
    setData: function (originData) {
        var self = this,
            data = {nodes: [], lines: []};
        if (!originData) return data;
        // 缓存原始数据
        this.originData = originData;
        if (Array.isArray(originData.nodes)) {
            originData.nodes.forEach(function (node) {
                data.nodes.push({
                    id: self.number + '-' + (++self.autoIncrement),
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
        return data;
    },
    load: function(data) {
        this.setData(data);
        this.draw();
    },
    draw: function() {
        this.clear();
        view.render.call(this);
        // 重新初始边界
        this.boundaries = {
            x: CONSTANT.HM_BOUNDARIES_X_Y,
            y: CONSTANT.HM_BOUNDARIES_X_Y,
            w: 0,
            h: 0
        };
    },
    clear: function() {
        view.clear.call(this);
    },
    getDom2Obj: function(dom) {
        var container = view.searchUp(dom, CONSTANT.HM_CONTAINER);     // 获取容器
        if (container)
            return cache.get(container.getAttribute(CONSTANT.HM_ID));  // 获取拖拽对象
    }
};

var heatmap = {
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
    destroy: function (heatmap) {
        if (heatmap) {
            heatmap.container.removeAttribute(DK_ID);
            cache.remove(heatmap);
            heatmap.destroy();
            heatmap = null;
        }
    }
};

return heatmap;

})));
