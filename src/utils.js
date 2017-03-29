"use strict";

import {CONSTANT as CONST, globalConfig} from './config';

// 工具类
export default {
    // 属性拷贝
    extend: function(mod, opt) {
        if (!opt) return mod;
        var conf = {};
        for (var k in mod) {
            if (typeof opt[k] === "object") {
                conf[k] = this.extend(mod[k], opt[k])
            } else {
                conf[k] = typeof opt[k] !== 'undefined' ? opt[k] : mod[k];
            }
        }
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
    getComputedWH(dom) {
        var computed = getComputedStyle(dom);
        return {
            width: (computed.width.replace(/px/, '')) * 1,
            height: (computed.height.replace(/px/, '')) * 1
        }
    },
    getNodeHeight: function (height) {
        if (height > this.opt._height) {
            return this.opt._height;
        }
        if (height < CONST.HM_NODE_HEIGHT_MIN) {
            return CONST.HM_NODE_HEIGHT_MIN;
        }
        return height;
    },
    getNodeWeight: function (weight) {
        if (weight > CONST.HM_NODE_WEIGHT_MAX) {
            return CONST.HM_NODE_WEIGHT_MAX;
        }
        if (weight < CONST.HM_NODE_WEIGHT_MIN) {
            return CONST.HM_NODE_WEIGHT_MIN;
        }
        return weight;
    },
    getNodeAlpha: function (weight) {
        var alpha = weight / CONST.HM_NODE_WEIGHT_MAX;
        if (alpha > CONST.HM_NODE_ALPHA_MAX) {
            return CONST.HM_NODE_ALPHA_MAX;
        }
        if (alpha < CONST.HM_NODE_ALPHA_MIN) {
            return CONST.HM_NODE_ALPHA_MIN;
        }
        return alpha;
    },
    resetBoundaries: function() {
        // 重新初始边界
        return {
            x: CONST.HM_BOUNDARIES_X_Y,
            y: CONST.HM_BOUNDARIES_X_Y,
            w: 0,
            h: 0
        };
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
    setAttentionBoundaries: function(rectX, rectY, rectW, rectH, boundaries) {
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
    }
};