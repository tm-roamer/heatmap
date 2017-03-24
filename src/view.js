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

        canvas.classList.add(CONST.HM_CANVAS);
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

export default view;