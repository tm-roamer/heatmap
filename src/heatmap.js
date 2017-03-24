'use strict';

import {CONSTANT as CONST, globalConfig} from './config';
import cache from './cache';
import utils from './utils';
import view from './view';
import handleEvent from './handleEvent';

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
            x: CONST.HM_BOUNDARIES_X_Y,
            y: CONST.HM_BOUNDARIES_X_Y,
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
            x: CONST.HM_BOUNDARIES_X_Y,
            y: CONST.HM_BOUNDARIES_X_Y,
            w: 0,
            h: 0
        };
    },
    clear: function() {
        view.clear.call(this);
    },
    getDom2Obj: function(dom) {
        var container = view.searchUp(dom, CONST.HM_CONTAINER);     // 获取容器
        if (container)
            return cache.get(container.getAttribute(CONST.HM_ID));  // 获取拖拽对象
    }
};

export default {
    instance: function (options, container, originData) {
        if (container && !container.hasAttribute(CONST.HM_ID)) {
            // 初始化监听
            handleEvent.init(true, document.body);
            // 初始化缓存
            cache.init();
            // 初始化实例
            var index = cache.index();
            container.setAttribute(CONST.HM_ID, index);
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