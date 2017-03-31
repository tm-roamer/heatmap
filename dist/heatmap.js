(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.heatmap = factory());
}(this, (function () { 'use strict';

var f = function() {};

// 常量
var CONSTANT = {
    THROTTLE_TIME: 14,                              // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
    HM_NODE_WEIGHT_MAX: 255,                        // 绘制节点的weight权重最大值
    HM_NODE_WEIGHT_MIN: 0,                          // 绘制节点的weight权重最小值
    HM_NODE_HEIGHT_MIN: 1,                          // 绘制注意力热图的节点最小高度
    HM_NODE_ALPHA_MAX: 1,                           // 绘制节点的alpha透明度最大值
    HM_NODE_ALPHA_MIN: 0.01,                        // 绘制节点的alpha透明度最小值
    HM_USER_SELECT: "hm-user-select",               // 拖拽进行中, 在body标签动态绑定, 防止文本选中
    HM_OUTER_CONTAINER: 'hm-outer-container',       // 外容器classname
    HM_CONTAINER: 'hm-container',                   // 容器classname
    HM_ANIMATE: 'hm-animate',                       // 动画classname
    HM_CANVAS: 'hm-canvas',                         // 画布canvas的classname
    HM_MINI_CONTAINER: 'hm-mini-container',         // 缩略图容器classname
    HM_MINI_SLIDER: 'hm-mini-slider',               // 缩略图滑块classname
    HM_MINI_MASK: 'hm-mini-mask',                   // 缩略图遮罩classname
    HM_MINI_MASK_TOP: 'hm-mini-mask-top',           // 缩略图上遮罩classname
    HM_MINI_MASK_RIGHT: 'hm-mini-mask-right',       // 缩略图右遮罩classname
    HM_MINI_MASK_BOTTOM: 'hm-mini-mask-bottom',     // 缩略图下遮罩classname
    HM_MINI_MASK_LEFT: 'hm-mini-mask-left',         // 缩略图左遮罩classname
    HM_MINI_CANVAS: 'hm-mini-canvas',               // 缩略图画布canvas的classname
    HM_ID: 'data-hm-id',                            // 标识id
    HM_PAGE: 'data-hm-page'                         // 标识分页

};

// 配置项
var globalConfig = {
    container: null,                                // 画布容器
    outerContainer: null,                           // 画布容器的容器, 主要用来控制缩略图和热图之间的联动
    scale: 1,                                       // 缩放比
    radius: 40,                                     // 热力点半径
    height: 40,                                     // 注意力热图默认高度
    nodeBlur: 0.15,                                 // 节点辉光, 通过radialGradient的内圆radius * nodeBlur来实现.
    gradient: {                                     // 调色板
        // 配色方案一
        0.25: "rgb(0, 0, 255)",
        0.55: "rgb(0, 255, 0)",
        0.85: "rgb(255, 255, 0)",
        1.0: "rgb(255, 0, 0)"
        // 配色方案二
        // 0.45: "rgb(0, 0, 255)",
        // 0.55: "rgb(0, 255, 255)",
        // 0.65: "rgb(0, 255, 0)",
        // 0.95: "rgb(255, 255, 0)",
        // 1.0: "rgb(255, 0, 0)"
    },
    pagination: {
        current: 1,                                 // 第几块缓存
        pageSize: 10000,                            // 每块缓存高度
    },
    mini: {
        enabled: false,                             // 是否启用缩略图
        sliderMinHeight: 30,                        // 滑块的最小高度
        sliderPaddingTop: 2,                        // 滑块滑到顶部的空隙距离
        sliderPaddingBottom: 2,                     // 滑块滑到底部的空隙距离
        el: '',                                     // 缩略图容器的选择器, 类型: 字符串
        onDragStart: f,                             // 回调监听: 开始拖拽
        onDrag: f,                                  // 回调监听: 拖拽
        onDragEnd: f,                               // 回调监听: 结束拖拽
        onClick: f                                  // 回调监听: 点击
    },
    onScroll: f                                     // 回调监听: 滚动条
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
    extend: function(mod, opt) {
        if (!opt) return mod;
        var conf = {};
        for (var k in mod) {
            if (typeof opt[k] === "object")
                conf[k] = this.extend(mod[k], opt[k]);
            else
                conf[k] = typeof opt[k] !== 'undefined' ? opt[k] : mod[k];
        }
        return conf;
    },
    clone: function(o2) {
        var o1 = {};
        for (var k in o2) o1[k] = o2[k];
        return o1;
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
    getComputedWH(dom) {
        var computed = getComputedStyle(dom);
        return {
            width: (computed.width.replace(/px/, '')) * 1,
            height: (computed.height.replace(/px/, '')) * 1
        }
    },
    getNodeHeight: function (height) {
        if (height > this.opt.maxHeight)
            return this.opt.maxHeight;
        if (height < CONSTANT.HM_NODE_HEIGHT_MIN)
            return CONSTANT.HM_NODE_HEIGHT_MIN;
        return height;
    },
    getNodeWeight: function (weight) {
        if (weight > CONSTANT.HM_NODE_WEIGHT_MAX)
            return CONSTANT.HM_NODE_WEIGHT_MAX;
        if (weight < CONSTANT.HM_NODE_WEIGHT_MIN)
            return CONSTANT.HM_NODE_WEIGHT_MIN;
        return weight;
    },
    getNodeAlpha: function (weight) {
        var alpha = weight / CONSTANT.HM_NODE_WEIGHT_MAX;
        if (alpha > CONSTANT.HM_NODE_ALPHA_MAX)
            return CONSTANT.HM_NODE_ALPHA_MAX;
        if (alpha < CONSTANT.HM_NODE_ALPHA_MIN)
            return CONSTANT.HM_NODE_ALPHA_MIN;
        return alpha;
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
    colorize: function (ctx) {
        var colorPalette = this.colorPalette;
        // 取得图像
        var img = this.shadowCtx.getImageData(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);
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
        ctx.putImageData(img, 0, 0);
    },
    // 清除
    clear: function () {
        this.shadowCtx.clearRect(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);
        // 清除所有分屏
        this.splitScreen.forEach(function(v) {
            v.ctx.clearRect(0, 0, v.canvas.width, v.canvas.height);
        });
    },
    // 批量渲染
    renderBatch: function() {
        var self = this;
        this.splitScreen.forEach(function(v, i) {
            var dataLimit = self.getDataLimit(i + 1, self.opt.pagination.pageSize);
            view.render.call(self, dataLimit.nodes, dataLimit.attention, v.ctx);
        });
    },
    // 渲染
    render: function (nodes, attention, ctx) {
        var tpl, self = this,
            shadowCtx = this.shadowCtx,
            nodeBlur = this.opt.nodeBlur;
        nodes = nodes || this.data.nodes;
        attention = attention || this.data.attention;
        // 点击热图
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
            view.colorize.call(this, ctx);
        }
        // 注意力热图
        if (Array.isArray(attention) && attention.length > 0) {
            attention.forEach(function(node) {
                // 缓存模板
                if (!self._attentionTemplates[node.height]) {
                    self._attentionTemplates[node.height] = tpl =
                        view.getAttentionTemplate(self.opt.maxWidth, node.height);
                } else {
                    tpl = self._attentionTemplates[node.height];
                }
                shadowCtx.globalAlpha = node.alpha;
                shadowCtx.drawImage(tpl, 0, node.y);
            });
            view.colorize.call(this, ctx);
        }
    },
    // 初始化
    init: function () {
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        this.colorPalette = view.getColorPalette.call(this);
        this._templates = {};                               // 根据节点半径, 缓存节点模板
        this._attentionTemplates = {};                      // 根据节点高度, 缓存节点模板
        this.container.classList.add(CONSTANT.HM_CONTAINER);
        // 循环添加分屏
        var opt = this.opt,
            pagination = opt.pagination,
            shadowCanvas = this.shadowCanvas;
        var computed = utils.getComputedWH(this.container);
        opt.maxWidth = shadowCanvas.width = computed.width;
        var page = 0,
            height = opt.maxHeight = computed.height,
            pageSize = shadowCanvas.height = pagination.pageSize;
        while(page * pageSize <= height) {
            page++;
            var canvas = view.createCanvas.call(this, opt.maxWidth, pagination.pageSize, page).canvas;
            this.container.appendChild(canvas);
        }
    },
    createCanvas: function(width, height, page) {
        var splitScreen = this.splitScreen,
            canvas =document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.classList.add(CONSTANT.HM_CANVAS);
        canvas.setAttribute(CONSTANT.HM_PAGE, page);
        return splitScreen[splitScreen.length] = {
            canvas: canvas,
            ctx: canvas.getContext('2d')
        };
    }
};

/**
 * 展示对象 操作缩略图展示
 * 描述: 因为每一个缩略图都是独立的canvas进行展示, view变身api通过apply, call来进行调用.
 */
var thumbnail = {
    init: function() {
        var mini = this.mini,
            index = this._number,
            miniOption = this.opt.mini;
        if (miniOption.enabled && miniOption.el) {
            var fragment = document.createDocumentFragment();
            mini.container = document.querySelector(miniOption.el);
            mini.canvas = document.createElement('canvas');
            mini.ctx = mini.canvas.getContext('2d');
            thumbnail.createSlider(mini, fragment, index);
            thumbnail.createMask(mini.mask, fragment);
            thumbnail.setContainerStyle(mini, index);
            thumbnail.setSliderHeight.call(this);
            mini.container.appendChild(fragment);
        }
    },
    createSlider: function(mini, fragment, index) {
        var slider = mini.slider = document.createElement('div');
        slider.setAttribute(CONSTANT.HM_ID, index);
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
    setContainerStyle: function(mini, index) {
        // 设置宽高样式
        var computed = utils.getComputedWH(mini.container);
        mini.canvas.width = computed.width;
        mini.canvas.height = computed.height;
        mini.canvas.classList.add(CONSTANT.HM_MINI_CANVAS);
        mini.container.classList.add(CONSTANT.HM_MINI_CONTAINER);
        mini.container.setAttribute(CONSTANT.HM_ID, index);
    },
    setSliderHeight() {
        var mini = this.mini,
            miniOption = this.opt.mini,
            sliderMinHeight = miniOption.sliderMinHeight,
            outerContainer = this.outerContainer,
            outerHeight = utils.getComputedWH(outerContainer).height;
        // 外容器的高度即为分屏的显示高度
        var height =  outerHeight / this.maxHeight * mini.canvas.height;
        // 限制最小高度
        if (height < sliderMinHeight) {
            height = sliderMinHeight;
        }
        thumbnail.move.call(this, {y: 0, h: height});
    },
    move: function(coord) {
        if (!this && !this.mini) return;
        var y = coord.y = Math.ceil(coord.y),
            mini = this.mini,
            miniOption = this.opt.mini,
            maxHeight = mini.canvas.height;
        coord.h = coord.h || parseInt(mini.slider.style.height);
        // 计算尺寸
        if (coord.y + coord.h >= maxHeight) {
            y = maxHeight - coord.h;
            coord.y = y - miniOption.sliderPaddingBottom;
        }
        if (coord.y <= 0) {
            y = 0;
            coord.y = miniOption.sliderPaddingTop;
        }
        // 滑块, 遮罩
        mini.slider.style.cssText = 'height:' + coord.h + 'px;top:' + coord.y + 'px';
        mini.mask.top.style.cssText = 'height:' + coord.y + 'px';
        mini.mask.right.style.cssText = 'height:' +coord.h + 'px;top:' + coord.y + 'px';
        mini.mask.bottom.style.cssText = 'top:' + (coord.y + coord.h) + 'px';
        mini.mask.left.style.cssText = 'height:' + coord.h + 'px;top:' + coord.y + 'px';
        return y;
    },
    clear: function () {
        var mini = this.mini;
        mini.ctx.clearRect(0, 0, mini.canvas.width, mini.canvas.height);
    },
    render: function() {
        var mini = this.mini;
        // @fix 规则改了
        // 生成缩略图
        var computed = utils.getComputedWH(this.container);
        mini.ctx.drawImage(this.shadowCanvas, 0, 0, computed.width, computed.height,
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
        document.addEventListener('click', this.click, false);
        // document.addEventListener('DOMMouseScroll', this.wheel, false);
        // document.addEventListener('mousewheel', this.wheel, false);
        this.isbind = true;
    },
    globalUnbind: function () {
        document.removeEventListener('mousedown', this.mouseDown, false);
        document.removeEventListener('mousemove', this.mouseMove, false);
        document.removeEventListener('mouseup', this.mouseUp, false);
        document.removeEventListener('click', this.click, false);
        // document.removeEventListener('DOMMouseScroll', this.wheel, false);
        // document.removeEventListener('mousewheel', this.wheel, false);
        this.isbind = false;
    },
    bind: function() {
        this.outerContainer.addEventListener('scroll', handleEvent.scroll, false);
    },
    unbind: function() {
        this.outerContainer.removeEventListener('scroll', handleEvent.scroll, false);
    },
    mouseDown: function (event) {
        // 点击滑块
        var target = event.target;
        // 可以拖拽滑块, 也可以拖拽外容器的原生滚动条
        if (target.classList.contains(CONSTANT.HM_MINI_SLIDER)) {
            document.body.classList.add(CONSTANT.HM_USER_SELECT);
            handleEvent.isDrag = true;
            handleEvent.heatmap = cache.get(target.getAttribute(CONSTANT.HM_ID) * 1);
            handleEvent.offsetX = event.offsetX || 0;
            handleEvent.offsetY = event.offsetY || 0;
            // 回调函数
            handleEvent.heatmap.opt.mini.onDragStart.call(handleEvent.heatmap, event);
        }
    },
    mouseMove: function (event) {
        // 拖拽状态, 拖拽元素
        if (!handleEvent.isDrag) return;
        // 函数节流
        if (!utils.throttle(new Date().getTime())) return;
        // 联动
        handleEvent.linkage.call(handleEvent.heatmap, event.pageY, handleEvent.offsetY);
        // 回调
        handleEvent.heatmap.opt.mini.onDrag.call(handleEvent.heatmap, event);
    },
    mouseUp: function (event) {
        // 回调函数
        if (handleEvent.isDrag) {
            document.body.classList.remove(CONSTANT.HM_USER_SELECT);
            handleEvent.heatmap.opt.mini.onDragEnd.call(handleEvent.heatmap, event);
        }
        delete handleEvent.heatmap;
        delete handleEvent.isDrag;
        delete handleEvent.offsetX;
        delete handleEvent.offsetY;
    },
    click: function (event) {
        var target = event.target;
        if (target.classList.contains(CONSTANT.HM_MINI_SLIDER)) return;
        // 点击缩略图
        var miniContainer = handleEvent.searchUp(target, CONSTANT.HM_MINI_CONTAINER);
        if (miniContainer) {
            // 加入动画
            miniContainer.classList.add(CONSTANT.HM_ANIMATE);
            // 移动滑块
            var heatmap = cache.get(miniContainer.getAttribute(CONSTANT.HM_ID) * 1);
            // 联动
            handleEvent.linkage.call(heatmap, event.pageY);
            // 回调
            heatmap.opt.mini.onClick.call(heatmap, event);
            // @fix 配合css动画, 待优化使用requestAnimationFrame
            setTimeout(function() {
                miniContainer.classList.remove(CONSTANT.HM_ANIMATE);
            }, 100);
        }
    },
    wheel: function (event) {
        var outerContainer = handleEvent.searchUp(event.target, CONSTANT.HM_OUTER_CONTAINER);
        if (outerContainer) {
            // 联动缩略图
            var heatmap = cache.get(outerContainer.getAttribute(CONSTANT.HM_ID) * 1);
            heatmap.moveSlider(outerContainer.scrollTop);
        }
    },
    scroll: function(event) {
        var heatmap = cache.get(event.currentTarget.getAttribute(CONSTANT.HM_ID) * 1);
        if (heatmap) {
            // var scrollTop = event.currentTarget.scrollTop,
            //     pagination = heatmap.opt.pagination;
            // // 切分屏
            // var page = Math.ceil(scrollTop / pagination.pageSize);
            // if (pagination.current != page) {
            //     pagination.current = page;
            //     heatmap.paging(pagination.current, pagination.pageSize);
            // }
            if (heatmap.opt.mini.enabled) {
                // 移动滑块
                heatmap.moveSlider(scrollTop);
            }
            // 回调函数
            heatmap.opt.onScroll.call(heatmap, event);
        }
    },
    searchUp: function (node, className) {
        if (!node || node === document.body || node === document) return undefined;   // 向上递归到顶就停
        if (node.classList.contains(className)) return node;
        return this.searchUp(node.parentNode, className);
    },
    // 联动(缩略图和热图画布联动)
    linkage: function(pageY, offsetY) {
        var mini = this.mini;
        // 计算缩略图容器坐标
        var offset = mini.container.getBoundingClientRect();
        // 点击触发时, 焦点应该位于滑块中间
        offsetY = offsetY || parseInt(mini.slider.style.height) / 2;
        // 移动滑块
        var y  = thumbnail.move.call(this, {y: pageY - offsetY - offset.top});
        // 联动热图画布
        var scale = y / mini.canvas.height;
        this.outerContainer.scrollTop = scale * this.opt.maxHeight;
    }
};

function HeatMap(options, originData, index) {
    var container = document.querySelector(options.container);
    var outerContainer = document.querySelector(options.outerContainer);
    if (!options.container || !options.outerContainer || !container || !outerContainer) {
        throw new Error ('Invalid HeatMap Container Selector');
    }
    container.setAttribute(CONSTANT.HM_ID, index);
    outerContainer.setAttribute(CONSTANT.HM_ID, index);
    this.container = container;                     // 容器DOM
    this.outerContainer = outerContainer;           // 外容器DOM
    handleEvent.unbind.call(this);                  // 解除监听
    handleEvent.bind.call(this);                    // 绑定监听
    this.init(options, originData, index);
}

HeatMap.prototype = {
    constructor: HeatMap,
    init: function(options, originData, index) {
        this._number = index;                           // 编号
        this.opt = utils.extend(globalConfig, options); // 配置项
        this.splitScreen = [];                          // 配置分屏数组
        view.init.call(this);                           // 初始渲染的视图层canvas
        this.data = this.setData(originData);           // 渲染数据
        this.draw();
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
            this.drawMini();
        }
    },
    destroy: function() {
        // 清除监听
        handleEvent.unbind.call(this);
        // 基础变量
        delete this.opt;
        delete this.data;
        delete this._number;
        delete this.container;
        delete this.originData;
        delete this.outerContainer;
        // 绘制变量
        delete this.splitScreen;
        delete this.shadowCanvas;
        delete this.shadowCtx;
        delete this.colorPalette;
        // 点击热图
        delete this._templates;
        // 注意力热图
        delete this._attentionTemplates;
        // 缩略图
        delete this.mini;
    },
    setData: function (originData) {
        var self = this,
            data = {nodes: [], attention: []};
        if (!originData) return data;
        this.originData = originData;                   // 缓存原始数据
        // 点击热图
        if (Array.isArray(originData.nodes)) {
            originData.nodes.forEach(function (node) {
                data.nodes.push({
                    x: node.x,                                  // 坐标: x
                    y: node.y,                                  // 坐标: y
                    weight: utils.getNodeWeight(node.weight),   // 权重: 0 - 255
                    alpha: utils.getNodeAlpha(node.weight),     // 透明度: 0 - 1
                    radius: node.radius                         // 半径: 默认 40
                });
            });
        }
        // 注意力热图
        if (Array.isArray(originData.attention)) {
            originData.attention.forEach(function (node) {
                data.attention.push({
                    y: node.y,                                           // 坐标: y
                    height: utils.getNodeHeight.call(self, node.height), // 高度: 默认 40
                    weight: utils.getNodeWeight(node.weight),            // 权重: 0 - 255
                    alpha: utils.getNodeAlpha(node.weight),              // 透明度: 0 - 1
                });
            });
        }
        return data;
    },
    getDataLimit: function(current, pageSize) {
        var limit = {nodes: [], attention: []},
            max = current * pageSize,
            min = max - pageSize,
            data = this.data;
        // 点击热图
        data.nodes.forEach(function (node) {
            // 边界的节点不能一刀切, 展示的节点会被切割, 需要做包含处理
            if ((min <= node.y || min <= node.y + node.radius)
                && (node.y <= max || node.y - node.radius <= max)) {
                var n = utils.clone(node);
                n.y -= min;     // 控制分屏渲染偏移,
                limit.nodes.push(n);
            }
        });
        // 注意力热图
        data.attention.forEach(function (node) {
            if ((min <= node.y || min <= node.y + node.height / 2)
                && (node.y <= max || node.y - node.height / 2 <= max)) {
                var n = utils.clone(node);
                n.y -= min;
                limit.attention.push(n);
            }
        });
        return limit;
    },
    load: function(data) {
        this.setData(data);
        this.draw();
        this.opt.mini.enabled && this.drawMini();
    },
    clear: function() {
        view.clear.call(this);
    },
    draw: function() {
        this.clear();
        view.renderBatch.call(this);    // 渲染画布
    },
    clearMini: function() {
        thumbnail.clear.call(this);
    },
    drawMini: function() {
        this.clearMini();
        // @fix ctx
        thumbnail.render.call(this);
    },
    moveSlider: function(scrollTop) {
        if (!this.opt.mini.enabled) return;
        // 联动缩略图滑块
        var scale = scrollTop / this.opt.maxHeight;
        var y = scale * this.mini.canvas.height;
        thumbnail.move.call(this, {y: y});
    }
};

var heatmap = {
    version: "1.0.4",
    instance: function (options, originData) {
        // 初始化监听
        handleEvent.init(true, document.body);
        // 初始化缓存
        cache.init();
        // 初始化实例
        return cache.set(new HeatMap(options, originData, cache.index()));
    },
    destroy: function (obj) {
        if (obj) {
            obj.container.removeAttribute(CONSTANT.HM_ID);
            cache.remove(obj);
            obj.destroy();
            obj = null;
        }
        cache.arr == 0 && handleEvent.globalUnbind();
    }
};

return heatmap;

})));
