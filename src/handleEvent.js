"use strict";

import {CONSTANT as CONST, globalConfig} from './config';
import thumbnail from './thumbnail';
import cache from './cache';
import utils from './utils';

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
        document.addEventListener('DOMMouseScroll', this.wheel, false);
        document.addEventListener('mousewheel', this.wheel, false);
        this.isbind = true;
    },
    globalUnbind: function () {
        document.removeEventListener('mousedown', this.mouseDown, false);
        document.removeEventListener('mousemove', this.mouseMove, false);
        document.removeEventListener('mouseup', this.mouseUp, false);
        document.removeEventListener('click', this.click, false);
        document.removeEventListener('DOMMouseScroll', this.wheel, false);
        document.removeEventListener('mousewheel', this.wheel, false);
        this.isbind = false;
    },
    mouseDown: function (event) {
        // 点击滑块
        var slider = event.target;
        if (slider.classList.contains(CONST.HM_MINI_SLIDER)) {
            document.body.classList.add(CONST.HM_USER_SELECT);
            handleEvent.isDrag = true;
            handleEvent.heatmap = cache.get(slider.getAttribute(CONST.HM_ID) * 1);
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
            document.body.classList.remove(CONST.HM_USER_SELECT);
            handleEvent.heatmap.opt.mini.onDragEnd.call(handleEvent.heatmap, event);
        }
        delete handleEvent.heatmap;
        delete handleEvent.isDrag;
        delete handleEvent.offsetX;
        delete handleEvent.offsetY;
    },
    click: function (event) {
        var target = event.target;
        if (target.classList.contains(CONST.HM_MINI_SLIDER)) return;
        // 点击缩略图
        var miniContainer = handleEvent.searchUp(target, CONST.HM_MINI_CONTAINER);
        if (miniContainer) {
            // 移动滑块
            var heatmap = cache.get(miniContainer.getAttribute(CONST.HM_ID) * 1);
            // 联动
            handleEvent.linkage.call(heatmap, event.pageY);
            // 回调
            heatmap.opt.mini.onClick.call(heatmap, event);
        }
    },
    // 滚动条
    wheel: function (event) {
        var container = handleEvent.searchUp(event.target, CONST.HM_CONTAINER);
        if (container) {
            var heatmap = cache.get(container.getAttribute(CONST.HM_ID) * 1);
            // 联动缩略图
            heatmap.linkage(heatmap.outerContainer.scrollTop);
        }
    },
    searchUp: function (node, className) {
        if (!node || node === document.body || node === document) return undefined;   // 向上递归到顶就停
        if (node.classList.contains(className)) return node;
        return this.searchUp(node.parentNode, className);
    },
    // 联动(缩略图和热图画布联动)
    linkage: function(pageY, offsetY) {
        // 计算缩略图容器坐标
        var offset = this.mini.container.getBoundingClientRect();
        // 移动滑块
        var y  = thumbnail.move.call(this, {
            y: pageY - (offsetY || 0) - offset.top
        });
        // 联动热图画布
        var scale = y / this.mini.canvas.height;
        this.outerContainer.scrollTop = scale * this.canvas.height;
    }
};

export default handleEvent;