"use strict";

// 缓存对象
export default {
    init: function () {
        if (!this.arr) this.arr = [];
    },
    get: function (idx) {
        // 避免0的情况, if条件判断麻烦
        return this.arr[idx - 1];
    },
    set: function (obj) {
        this.arr.push(obj);
        return obj;
    },
    remove: function(dk) {
        this.arr.forEach(function(obj, i, arr) {
            dk === obj && arr.splice(i, 1);
        });
    },
    index: function () {
        return this.arr.length + 1;
    },
    list: function() {
        return this.arr;
    }
};