/**
 * Module dependencies.
 */

var models = require('../models')
  , User = models.User
  , Relation = models.Relation
  , Focus = models.Focus
  , utils = require('../lib/utils')
  , config = require('../config')
  , common = require('./common')
  , querystring = require('querystring')
  , get_logs = require('./ask').get_logs
  , EventProxy = require('../lib/eventproxy').EventProxy;

exports.load = function(id, callback) {
    User.findById(id, callback);
};

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
	if(utils.md5(userdb + config.session_secret) != verify) {
	    return res.send(common.json_data_response({message: 'verify error, userdb: ' + userdb}));
	}
	var user_agent = req.headers['user-agent'];
	userdb = utils.strcode(userdb, user_agent, config.session_secret, true);
	userdb = querystring.decode(userdb);
	if(!userdb.uid) {
	    return res.send(common.json_data_response({message: 'userdb error, userdb: ' + userdb}));
	}
	User.findOne({uid: userdb.uid}, function(err, user) {
		if(err) return next(err);
		if(!user) user = new User();
		user.name = userdb.username;
		user.password = userdb.password;
		user.uid = userdb.uid;
		user.type = userdb.usertype; // usertype : 1 stander, 2 professional
		user.save(function(err) {
			if(err) { return next(err); }
			var auth_token = utils.strcode(userdb.uid + '\t' + utils.md5(userdb.uid), user_agent, config.session_secret);
			res.cookie(config.auth_cookie_name, auth_token, { maxAge: 900000, path: '/' });
			res.send(common.json_data_response(null, {user: user}));
		});
	});
};

/**
 * 处理请求的用户信息
 * 根据ask.authuser和session 获取登陆用户信息
 * 
 */
exports.user_middleware = function(req, res, next) {
	if(!res._locals) {
        res._locals = {};
    }
	res.local('current_user', null);
	if(req.session && req.session.user) {
		res.local('current_user', req.session.user);
	}
	if(req.session.user || !req.cookies[config.auth_cookie_name]) return next();
	var authuser = req.cookies[config.auth_cookie_name];
	authuser = utils.strcode(authuser, req.headers['user-agent'], config.session_secret, true).split('\t');
	var uid = authuser[0]
	  , password = authuser[1];
	if(!uid || !password) return next();
	User.findOne({uid: uid}, function(err, user) {
		if(err) return next(err);
		if(user && user.password === password) {
			req.session.user = user;
			req.session.user_id = user.id;
			user.is_admin = true;
			res.local('current_user', user);
		}
		next();
	});
};

/**
 * 跟随 /user/follow/:user_id
 */
exports.follow = function(req, res, next) {
	if(!req.session || !req.session.user) {
		return next();
	}
	var uid = req.params.user_id
	  , fid = req.session.user_id;
	Relation.findOne({uid: uid, fid: fid}, function(err, relation) {
		if(err) return next(err);
		if(!relation) {
			relation = new Relation();
		}
		relation.uid = uid;
		relation.fid = fid;
		// 判断对方是否也跟随
		Relation.findOne({uid: fid, fid: uid}, function(err, f_relation) {
			if(err) return res.send(common.json_data_response(err));
			if(f_relation) {
				relation.each_other = f_relation.each_other = 1;
				f_relation.save();
			}
			relation.save(function(err) {
				res.send(common.json_data_response(err, {relation: relation}));
			});
		});
	});
};

/**
 * 取消跟随 /user/unfollow/:user_id
 */
exports.unfollow = function(req, res, next) {
	if(!req.session || !req.session.user) {
		return next();
	}
	var uid = req.params.user_id
	  , fid = req.session.user_id;
	Relation.remove({uid: uid, fid: fid}, function(err) {
	    res.send(common.json_data_response(err));
	});
	
	// 判断对方是否也跟随
	Relation.findOne({uid: fid, fid: uid}, function(err, f_relation) {
		if(f_relation) {
			f_relation.each_other = 0;
			f_relation.save();
		}
	});
};

/**
 * 获取热门用户列表
 */
exports.get_hot_users = function(req, res) {
	var limit = parseInt(req.query.limit) || 10;
	if(limit > 20) {
		limit = 10;
	}
	User.find({}, {}, {limit: limit, sort: [['score', 'desc']]}, function(err, users) {
		if(err) {
			return res.send('error: ' + err.message);
		}
		res.partial('hot_users_partial', {users: users});
	});
};

function read_follower_and_following_counts(user_id) {
    var followers_count_reader = Relation.count({uid: user_id});
    var following_count_reader = Relation.count({fid: user_id});
    return function(callback) {
        followers_count_reader(function(err1, count1) {
            following_count_reader(function(err2, count2) {
                callback(err1 || err2, count1, count2);
            });
        });
    };
};

function read_relaction(uid, fid) {
    return Relation.fetchByQuery(uid && fid ? {uid: uid, fid: fid} : null);
};

/**
 * https://gist.github.com/1084423
 * 
 * EventProxy
 * https://gist.github.com/1084499
 * 
 * 显示指定用户 profile 页面
 * 
 * 获取关注和被关注的数据
 * 获取此用户最近的活动数据
 *  - 活动数据里面包含各种数据的聚合
 * 判断当前登录的用户与指定用户是否已经相互关注
 * 
 */
exports.show = function(req, res, next) {
    var current_user_id = req.session.user_id
      , query = {user_id: req.user.id};
    if(req.query.max) {
        query.create_at = {$lt: new Date(req.query.max)};
    }
    var event = new EventProxy();
    event.assign('relation', 'follower_counts', 'logs', function(relation, follower_counts, logs) {
        if(req.xhr) {
            res.partial('log', logs);
        } else {
            if(relation) {
                req.user.focus = true;
            }
            if(follower_counts) {
                req.user.follower_count = follower_counts.follower_count;
                req.user.following_count = follower_counts.following_count;
            }
            res.render('user/detail', {user: req.user, logs: logs});
        }
    });
    event.on('error', function(err) {
        event.removeAllListeners();
        next(err);
    });
    get_logs(query, function(err, logs) {
        if(err) { return event.emit('error', err); }
        // 判断是否已关注
        if(current_user_id && logs && logs.length > 0) {
            var qids = {};
            for(var i = 0, len = logs.length; i < len; i++) {
                var log = logs[i];
                qids[log.question.id] = log.question;
            }
            Focus.find({qid: {$in: Object.keys(qids)}, uid: req.session.user_id}, function(err, focuses) {
                if(focuses) {
                    for(var i = 0, len = focuses.length; i < len; i++) {
                        qids[focuses[i].qid].focus = true;
                    }
                }
                event.emit('logs', logs);
            });
        } else {
            event.emit('logs', logs);
        }
    });
    
    if(!req.xhr) {
        // 加载完整页面，还需要获取关系信息，和跟随人数
        if(current_user_id) {
            Relation.findOne({uid: req.user.id, fid: current_user_id}, function(err, relation) {
                if(err) { return event.emit('error', err); }
                event.emit('relation', relation);
            });
        } else {
            event.emit('relation');
        }
        read_follower_and_following_counts(req.user.id)(function(err, follower_count, following_count) {
            if(err) { return event.emit('error', err); }
            event.emit('follower_counts', {follower_count: follower_count, following_count: following_count});
        });
    } else {
        // 无需获取
        event.emit('relation');
        event.emit('follower_counts');
    }
};

exports._show = function(req, res, next) {
    var current_user_id = req.session.user_id;
    var query = {user_id: req.user.id};
    if(req.query.max) {
        query.create_at = {$lt: new Date(req.query.max)};
    }
    var relation_reader = read_relaction(req.user.id, current_user_id);
    var follow_counts_reader = read_follower_and_following_counts(req.user.id);
    get_logs(query, function(err, logs) {
        if(err) return next(err);
        relation_reader(function(err, relation) {
            if(err) return next(err);
            if(relation && relation.length > 0) {
                req.user.focus = true;
            }
            follow_counts_reader(function(err, follower_count, following_count) {
                if(err) return next(err);
                req.user.follower_count = follower_count;
                req.user.following_count = following_count;
                if(req.xhr) {
                    res.partial('log', logs);
                } else {
                    res.render('user/detail', {user: req.user, logs: logs});
                }
            });
        });
    });
};

function handler_follow_users(following, req, res, next) {
    var keys = following ? ['fid', 'uid'] : ['uid', 'fid'];
    var query = {}, name = keys[1]
      , user_id = req.params.user_id
      , current_user_id = req.session.user_id;
    query[keys[0]] = user_id;
    if(req.query.max) {
        query.create_at = {$lt: new Date(req.query.max)};
    }
    Relation.find(query, [name], {limit: 20, sort: [['create_at', 'desc']]}, function(err, rs) {
        var fids = [];
        for(var i = 0, len = rs.length; i < len; i++) {
            fids.push(rs[i][name]);
        }
        var relations_reader = Relation.fetchByQuery(current_user_id ? {uid: {$in: fids}, fid: current_user_id} : null);
        User.find({_id: {$in: fids}}, function(err, users) {
            users = users.sort(function(a, b) {
                return a.create_at < b.create_at;
            });
            // 判断是否已经跟随
            relations_reader(function(err, relations) {
                if(err) { return next(err); };
                if(relations) {
                    var map_relations = {};
                    for(var i = 0, len = relations.length; i < len; i++) {
                        map_relations[relations[i].uid] = 1;
                    }
                    for(var i = 0, len = users.length; i < len; i++) {
                        if(map_relations[users[i].id]) {
                            users[i].focus = true;
                        }
                    }
                }
                if(req.xhr) {
                    res.partial('user/user', users);
                } else {
                    var follow_counts_reader = read_follower_and_following_counts(user_id);
                    var relation_reader = read_relaction(user_id, req.session.user_id);
                    User.fetchById(req.params.user_id, function(err, user) {
                        follow_counts_reader(function(err, follower_count, following_count) {
                            if(user) {
                                user.follower_count = follower_count;
                                user.following_count = following_count;
                            }
                            relation_reader(function(err, relation) {
                                if(relation && relation.length > 0) {
                                    user.focus = true;
                                }
                                res.render('user/list', {users: users, user: user});
                            });
                        });
                    });
                }
            });
        });
    });
};

exports.followers = function(req, res, next) {
    handler_follow_users(false, req, res, next);
};

exports.following = function(req, res, next) {
    handler_follow_users(true, req, res, next);
};