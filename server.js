/**
 * Module dependencies.
 */

require.paths.unshift('./support');
require('./public/js/lang');

var express = require('express')
  , config = require('./config')
  , ask_app = require('./index');

var app = express.createServer();

app.use('/ask', ask_app);

app.listen(config.port);
console.log('http://localhost:' + config.port);
console.log((process.env.NODE_ENV || 'development') + ' env');