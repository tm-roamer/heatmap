"use strict";

import {CONSTANT as CONST, globalConfig} from './config';
import utils from './utils';

/**
 * 展示对象 操作缩略图展示
 * 描述: 因为每一个缩略图都是独立的canvas进行展示, view变身api通过apply, call来进行调用.
 */
var thumbnail = {
    init: function () {
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
    createSlider: function (mini, fragment, index) {
        var slider = mini.slider = document.createElement('div');
        slider.setAttribute(CONST.HM_ID, index);
        slider.classList.add(CONST.HM_MINI_SLIDER);
        fragment.appendChild(slider);
    },
    createMask: function (mask, fragment) {
        var maskTop = mask.top = document.createElement('div'),
            maskRight = mask.right = document.createElement('div'),
            maskBottom = mask.bottom = document.createElement('div'),
            maskLeft = mask.left = document.createElement('div');
        maskTop.className = CONST.HM_MINI_MASK + ' ' + CONST.HM_MINI_MASK_TOP;
        maskRight.className = CONST.HM_MINI_MASK + ' ' + CONST.HM_MINI_MASK_RIGHT;
        maskBottom.className = CONST.HM_MINI_MASK + ' ' + CONST.HM_MINI_MASK_BOTTOM;
        maskLeft.className = CONST.HM_MINI_MASK + ' ' + CONST.HM_MINI_MASK_LEFT;
        fragment.appendChild(maskTop);
        fragment.appendChild(maskRight);
        fragment.appendChild(maskBottom);
        fragment.appendChild(maskLeft);
    },
    setContainerStyle: function (mini, index) {
        // 设置宽高样式
        var computed = utils.getComputedWH(mini.container);
        mini.canvas.width = computed.width;
        mini.canvas.height = computed.height;
        mini.canvas.classList.add(CONST.HM_MINI_CANVAS);
        mini.container.classList.add(CONST.HM_MINI_CONTAINER);
        mini.container.setAttribute(CONST.HM_ID, index);
    },
    setSliderHeight: function () {
        var mini = this.mini,
            miniOption = this.opt.mini,
            sliderMinHeight = miniOption.sliderMinHeight,
            outerContainer = this.outerContainer,
            outerHeight = utils.getComputedWH(outerContainer).height;
        // 外容器的高度即为分屏的显示高度
        var height = outerHeight / this.opt.maxHeight * mini.canvas.height;
        // 限制最小高度
        if (height < sliderMinHeight) {
            height = sliderMinHeight;
        }
        thumbnail.move.call(this, {y: 0, h: height});
    },
    move: function (coord) {
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
        mini.mask.right.style.cssText = 'height:' + coord.h + 'px;top:' + coord.y + 'px';
        mini.mask.bottom.style.cssText = 'top:' + (coord.y + coord.h) + 'px';
        mini.mask.left.style.cssText = 'height:' + coord.h + 'px;top:' + coord.y + 'px';
        return y;
    },
    clear: function () {
        var mini = this.mini;
        mini.ctx.clearRect(0, 0, mini.canvas.width, mini.canvas.height);
    },
    render: function () {
        var self = this,
            mini = this.mini,
            maxWidth = this.opt.maxWidth,
            maxHeight = this.opt.maxHeight;
        // 累加位置
        var position = 0;
        this.splitScreen.forEach(function (v, i) {
            // 只有一页的情况
            if (v.canvas.height === maxHeight) {
                mini.ctx.drawImage(v.canvas, 0, position, maxWidth, maxHeight,
                    0, 0, mini.canvas.width, mini.canvas.height); // 拉伸图片
            } else {
                var height = v.canvas.height / maxHeight * mini.canvas.height;
                mini.ctx.drawImage(v.canvas, 0, 0, maxWidth, v.canvas.height,
                    0, position, mini.canvas.width, height); // 拉伸图片
                position += height;
            }
        });
        // 插入缩略图
        mini.container.appendChild(mini.canvas);
    }
};

export default thumbnail;