/**
 * Module dependencies.
 */

var crypto = require('crypto');

/**
 * MD5 hash
 * 
 * @param {String} s
 * @param {String} encoding, optional, default is hex
 * @return depend on encoding
 * @api private
 */
var md5 = exports.md5 = function(s, encoding) {
	var h = crypto.createHash('md5');
	h.update(s);
	return h.digest(encoding || 'hex');
};

var base64_encode = exports.base64_encode = function(s, encoding) {
	encoding = encoding || 'utf8';
	return new Buffer(s, encoding).toString('base64');
};

var base64_decode = exports.base64_decode = function(s, encoding) {
	encoding = encoding || 'utf8';
	return new Buffer(s, 'base64').toString(encoding);
};

/**
 * A str encode and decode use on phpwind
 * 
 * @param {String} str
 * @param {String} user_agent, browser user_agent info
 * @param {String} key
 * @param {Boolen} decode, default is `false`
 * @return {String} encode or decode string
 * @api public
 */
exports.strcode = function (str, user_agent, key, decode) {
    var keybuffer = new Buffer(md5(user_agent + key).substring(8, 26));
    var key_length = keybuffer.length;
    var buffer = null, encoding = 'base64';
    if(decode) {
    	buffer = new Buffer(str, 'base64');
    	encoding = 'utf8';
    } else {
    	buffer = new Buffer(str, 'utf8');
    }
    for (var i = 0, len = buffer.length; i < len; i++) {
        var k = i % key_length;
        buffer[i] = buffer[i] ^ keybuffer[k];
    }
    return buffer.toString(encoding);
};

/**
 * Check if the request is ajax
 * 
 * @param {Object} req, request object
 * @return {Boolen} true or false
 * @api public
 */
exports.is_ajax = function(req) {
	return req.headers['x-requested-with'] == 'XMLHttpRequest';
};