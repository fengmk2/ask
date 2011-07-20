/**
 * Module dependencies.
 */
require.paths.push('modules');
require('./public/js/lang');

var express = require('express')
  , config = require('./config')
  , ask_app = require('./index');

var app = express.createServer();

var url_pre = config.url_pre || '/';
app.use(url_pre, ask_app);

app.listen(config.port);
console.log('http://localhost:' + config.port + url_pre);
console.log((process.env.NODE_ENV || 'development') + ' env');