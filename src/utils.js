"use strict";

import {CONSTANT as CONST, globalConfig} from './config';

// 工具类
export default {
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
            if (now - time > CONST.THROTTLE_TIME) {
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
        if (height < CONST.HM_NODE_HEIGHT_MIN) {
            return CONST.HM_NODE_HEIGHT_MIN;
        }
        return height;
    },
    getWeight: function (weight) {
        if (weight > CONST.HM_NODE_WEIGHT_MAX) {
            return CONST.HM_NODE_WEIGHT_MAX;
        }
        if (weight < CONST.HM_NODE_WEIGHT_MIN) {
            return CONST.HM_NODE_WEIGHT_MIN;
        }
        return weight;
    },
    getAlpha: function (weight) {
        var alpha = weight / CONST.HM_NODE_WEIGHT_MAX;
        if (alpha > CONST.HM_NODE_ALPHA_MAX) {
            return CONST.HM_NODE_ALPHA_MAX;
        }
        if (alpha < CONST.HM_NODE_ALPHA_MIN) {
            return CONST.HM_NODE_ALPHA_MIN;
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
            x: CONST.HM_BOUNDARIES_X_Y,
            y: CONST.HM_BOUNDARIES_X_Y,
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