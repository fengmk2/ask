/**
 * Module dependencies.
 */

var User = require('../models').User
  , utils = require('../lib/utils')
  , config = require('../config')
  , querystring = require('querystring');

/**
 * sync user info
 * 
 * 1. strcode decode, get userdb
 * 2. check verify === md5(userdb + secret-key)
 * 3. save user info by uid
 * 
 */
exports.sync_user = function(req, res, next) {
	var userdb = req.body ? req.body.userdb : req.query.userdb;
	var verify = req.body ? req.body.verify : req.query.verify;
	userdb = utils.strcode(userdb, req.headers['user-agent'], config.session_secret, true);
	if(utils.md5(userdb + config.session_secret) != verify) {
		return res.send(JSON.stringify({success: false, error: 'verify error', userdb: userdb}));
	}
	userdb = querystring.decode(userdb);
	User.findOne({uid: userdb.uid}, function(err, user) {
		if(err) return next(err);
		if(!user) user = new User();
		user.name = userdb.username;
		user.password = userdb.password;
		user.uid = userdb.uid;
		user.type = userdb.usertype; // usertype : 1 stander, 2 professional
		user.save(function(err) {
			if(err) { return next(err); }
			res.send(JSON.stringify({success: true, user: user}));
		});
	});
};

/**
 * 处理请求的用户信息
 * 根据ask.authuser和session 获取登陆用户信息
 * 
 */
exports.user_middleware = function(req, res, next) {
	//console.log(req.url, req.headers);
	if(!res._locals) {
        res._locals = {};
    }
	res._locals.current_user = null;
	if(req.session && req.session.user) {
		res._locals.current_user = req.session.user;
	}
	if(res._locals.current_user || !req.cookies['ask.authuser']) return next();
	var authuser = req.cookies['ask.authuser'];
	authuser = utils.strcode(authuser, req.headers['user-agent'], config.session_secret, true).split('\t');
	var uid = authuser[0];
	var password = authuser[1];
	console.log(authuser);
	if(!uid || !password) return next();
	User.findOne({uid: uid}, function(err, user) {
		if(err) return next(err);
		if(user && user.password === password) {
			req.session.user = user;
			res._locals.current_user = user;
			user.is_admin = true;
		}
		next();
	});
};
