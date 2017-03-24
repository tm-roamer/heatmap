"use strict";

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

function watch (curr, prev) {
    // console.log('监听文件', this, curr, prev);
    console.time('rollup');
    // ./node_modules/.bin/rollup src/heatmap.js --format umd --name 'heatmap'  --output dist/heatmap.js
    child_process.spawn('./node_modules/.bin/rollup',
        ['src/heatmap.js', '--format', 'umd', '--name', 'heatmap', '--output', 'dist/heatmap.js']);
    console.timeEnd('rollup');
}

console.log('开始监听...');

var basePath = path.join(__dirname, '../src');
var options = {
    persistent: true,
    interval: 1000
};
fs.watchFile(basePath + '/cache.js', options, watch);
fs.watchFile(basePath + '/config.js', options, watch);
fs.watchFile(basePath + '/handleEvent.js', options, watch);
fs.watchFile(basePath + '/heatmap.js', options, watch);
fs.watchFile(basePath + '/utils.js', options, watch);
fs.watchFile(basePath + '/view.js', options, watch);
