"use strict";

import {CONSTANT as CONST, globalConfig} from './config';
import utils from './utils';

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
            lines  = this.data.lines,
            attention = this.data.attention;
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
            view.colorize.call(this, this._boundaries);
        }
        // 阅读线
        if (Array.isArray(lines) && lines.length > 0) {
            lines.forEach(function(line) {
            });
        }
        // 注意力热图
        if (Array.isArray(attention) && attention.length > 0) {
            attention.forEach(function(node) {
                // 缓存模板
                if (!self._attentionTemplates[node.height]) {
                    self._attentionTemplates[node.height] = tpl = view.getAttentionTemplate(self.opt._width, node.height);
                } else {
                    tpl = self._attentionTemplates[node.height];
                }
                shadowCtx.globalAlpha = node.alpha;
                shadowCtx.drawImage(tpl, 0, node.y);
            });
            view.colorize.call(this, this._attentionBoundaries);
        }
    },
    // 设置样式
    setContainerStyle: function () {
        var opt = this.opt,
            canvas = this.canvas,
            shadowCanvas = this.shadowCanvas,
            container = this.container;
        canvas.classList.add(CONST.HM_CANVAS);
        var computed = utils.getComputedWH(container);
        opt._width = canvas.width = shadowCanvas.width = computed.width;
        opt._height = canvas.height = shadowCanvas.height = computed.height;
    },
    // 初始化
    init: function () {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        this.colorPalette = view.getColorPalette.call(this);
        this._templates = {};                               // 根据节点半径, 缓存节点模板
        this._attentionTemplates = {};                      // 根据节点高度, 缓存节点模板
        this._boundaries = utils.resetBoundaries();         // 重置绘制边界
        this._attentionBoundaries = utils.resetBoundaries();
        view.setContainerStyle.call(this);
        this.container.classList.add(CONST.HM_CONTAINER);
        this.container.appendChild(this.canvas);
    }
};

export default view;