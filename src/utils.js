"use strict";

import {CONSTANT as CONST, globalConfig} from './config';

// 工具类
export default {
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
        for (var k in o2) o1[k] = o2[k]
        return o1;
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
    getComputedWH: function (dom) {
        var computed = getComputedStyle(dom);
        return {
            width: (computed.width.replace(/px/, '')) * 1,
            height: (computed.height.replace(/px/, '')) * 1
        }
    },
    getNodeHeight: function (height) {
        if (height > this.opt.maxHeight)
            return this.opt.maxHeight;
        if (height < CONST.HM_NODE_HEIGHT_MIN)
            return CONST.HM_NODE_HEIGHT_MIN;
        return height;
    },
    getNodeWeight: function (weight) {
        if (weight > CONST.HM_NODE_WEIGHT_MAX)
            return CONST.HM_NODE_WEIGHT_MAX;
        if (weight < CONST.HM_NODE_WEIGHT_MIN)
            return CONST.HM_NODE_WEIGHT_MIN;
        return weight;
    },
    getNodeAlpha: function (weight) {
        var alpha = weight / CONST.HM_NODE_WEIGHT_MAX;
        if (alpha > CONST.HM_NODE_ALPHA_MAX)
            return CONST.HM_NODE_ALPHA_MAX;
        if (alpha < CONST.HM_NODE_ALPHA_MIN)
            return CONST.HM_NODE_ALPHA_MIN;
        return alpha;
    }
};