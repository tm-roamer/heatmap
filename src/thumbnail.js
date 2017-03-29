"use strict";

import {CONSTANT as CONST, globalConfig} from './config';
import utils from './utils';

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
    createSlider: function(mini, fragment, num) {
        var slider = mini.slider = document.createElement('div');
        slider.setAttribute(CONST.HM_ID, num);
        slider.classList.add(CONST.HM_MINI_SLIDER);
        fragment.appendChild(slider);
    },
    createMask: function(mask, fragment) {
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
    setContainerStyle: function(mini, num) {
        // 设置宽高样式
        var computed = utils.getComputedWH(mini.container);
        mini.canvas.width = computed.width;
        mini.canvas.height = computed.height;
        mini.canvas.classList.add(CONST.HM_MINI_CANVAS);
        mini.container.classList.add(CONST.HM_MINI_CONTAINER);
        mini.container.setAttribute(CONST.HM_ID, num);
    },
    setSliderHeight() {
        var mini = this.mini,
            miniOption = this.opt.mini,
            sliderMinHeight = miniOption.sliderMinHeight,
            outerContainer = this.outerContainer,
            outerHeight = utils.getComputedWH(outerContainer).height;
        // 外容器的高度即为分屏的显示高度
        var height =  outerHeight / this.canvas.height * mini.canvas.height;
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
        if (coord.y <= 0) {
            y = 0;
            coord.y = miniOption.sliderPaddingTop;
        }
        if (coord.y + coord.h >= maxHeight) {
            y = maxHeight - coord.h;
            coord.y = y - miniOption.sliderPaddingBottom;
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

export default thumbnail;