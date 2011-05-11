
var assert = require('assert')
  , utils = require('../lib/utils')
  , config = require('../config');

var user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24';

module.exports = {
	'base64 encode': function() {
		var strings = [
		    ['hello world', 'aGVsbG8gd29ybGQ='],
			['hello 中文base64加密', 'aGVsbG8g5Lit5paHYmFzZTY05Yqg5a+G']
		];
		strings.forEach(function(item) {
			assert.eql(utils.base64_encode(item[0]), item[1]);
		});
	}, 
	'base64 decode': function() {
		var strings = [
		    'hello 中文base64加密', 
		    'hello world',
		    '!@#!$!@$%$^%%&&*&()_+++====\'|\}]{[":;?/>.<,~`1234567890'
		];
		strings.forEach(function(s) {
			assert.eql(utils.base64_decode(utils.base64_encode(s)), s);
		});
  	},
  	'strcode': function() {
  		var strings = [
  		    ['hello world', 'WwRaWV4ZEQtEDVQ='],
  		    ['你好，中文', '19yW0JSEidi6hYiZgvPj']
  		];
  		var key = config.session_secret;
  		strings.forEach(function(item) {
  			var encode = utils.strcode(item[0], user_agent, key);
  			var decode = utils.strcode(encode, user_agent, key, true);
  			assert.eql(decode, item[0]);
  			if(item.length > 1) {
  				assert.eql(encode, item[1]);
  			}
  		});
  	}
};