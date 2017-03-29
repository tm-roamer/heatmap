'use strict';

import {CONSTANT as CONST, globalConfig} from './config';
import cache from './cache';
import utils from './utils';
import view from './view';
import thumbnail from './thumbnail';
import handleEvent from './handleEvent';

function HeatMap(options, originData) {
    var container = document.querySelector(options.container);
    var outerContainer = document.querySelector(options.outerContainer);
    if (!options.container || !options.outerContainer || !container || !outerContainer) {
        throw new Error ('Invalid HeatMap Container Selector');
    }
    var index = cache.index();
    container.setAttribute(CONST.HM_ID, index);
    outerContainer.setAttribute(CONST.HM_ID, index);
    this.container = container;                     // 容器DOM
    this.outerContainer = outerContainer;           // 外容器DOM
    this.init(options, originData, index);
}

HeatMap.prototype = {
    constructor: HeatMap,
    init: function(options, originData, index) {
        this._number = index;                           // 编号
        this.opt = utils.extend(globalConfig, options); // 配置项
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
        delete this.outerContainer;
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

export default {
    version: "1.0.2",
    instance: function (options, originData) {
        // 初始化监听
        handleEvent.init(true, document.body);
        // 初始化缓存
        cache.init();
        // 初始化实例
        return cache.set(new HeatMap(options, originData));
    },
    destroy: function (obj) {
        if (obj) {
            obj.container.removeAttribute(CONST.HM_ID);
            cache.remove(obj);
            obj.destroy();
            obj = null;
        }
        if (cache.arr == 0) {
            handleEvent.globalUnbind();
        }
    }
};