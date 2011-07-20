/**
 * Module dependencies.
 */

var models = require('../models')
  , common = require('./common')
  , config = require('../config')
  , Log = models.Log
  , Question = models.Question
  , Relation = models.Relation
  , Focus = models.Focus
  , User = models.User
  , os = require('os');


exports.index = function(req, res, next) {
    if(!req.session.user_id) {
        return res.redirect('/question');
    }
    var max_datetime = req.query.max;
    if(max_datetime) {
        max_datetime = new Date(max_datetime);
    }
    var focuses_reader = Focus.fetchByQuery({uid: req.session.user_id}, ['qid']);
    Relation.find({fid: req.session.user_id}, ['uid'], function(err, relations) {
        if(err) {
            return next(err);
        }
        var ids = [config.show_log_user_id];
        if(req.session.user_id) {
            ids.push(req.session.user_id);
        }
        for(var i = 0, len = relations.length; i < len; i++) {
            ids.push(relations[i].uid);
        }
        // 获取关注人的log和关注问题的log
        
        focuses_reader(function(err, focuses) {
            if(err) {
                return next(err);
            }
            var map_qids = {};
            for(var i = 0, len = focuses.length; i < len; i++) {
                map_qids[focuses[i].qid] = 1;
            }
            var qids = Object.keys(map_qids);
            var query = {$or: [{user_id: {'$in': ids}}, {target_id: {'$in': qids}}, {target_parent_id: {'$in': qids}}]};
            if(max_datetime) {
                query.create_at = {$lt: max_datetime};
            }
            get_logs(query, function(err, logs) {
                if(err) {
                    return next(err);
                }
                for(var i = 0, len = logs.length; i < len; i++) {
                    var log = logs[i];
                    if(log.question && map_qids[log.question.id]) {
                        log.question.focus = true;
                    }
                }
                if(req.xhr) {
                    res.partial('log', logs);
                } else {
                    res.render('index', {logs: logs});
                }
            });
        });
    });
};

var get_logs = exports.get_logs = function(query, callback) {
    Log.find(query, {}, {limit: 20, sort: [['create_at', 'desc']]}, function(err, logs) {
        if(err) { return callback(err); }
        var question_ids = {}, user_ids = {};
        for(var i = 0, len = logs.length; i < len; i++) {
            var log = logs[i];
            if(log.action === 'question') {
                log.question_id = log.target_id;
                question_ids[log.target_id] = 1;
                user_ids[log.user_id] = 1;
            } else if(log.action === 'answer') {
                log.question_id = log.target_parent_id;
                question_ids[log.question_id] = 1;
                user_ids[log.user_id] = 1;
            }
        }
        var questions_reader = Question.fetchByIds(Object.keys(question_ids));
        var users_reader = User.fetchByIds(Object.keys(user_ids));
        questions_reader(function(err, questions) {
            users_reader(function(user_err, users) {
                if(err || user_err) { return callback(err || user_err); }
                var needs = [];
                for(var i = 0, len = logs.length; i < len; i++) {
                    var log = logs[i];
                    log.question = questions[log.question_id];
                    if(log.question) {
                        log.user = users[log.user_id];
                        needs.push(log);
                    }
                }
                callback(null, needs);
            });
        });
    });
};

exports.monitor = function(req, res) {
    var usage = process.memoryUsage();
    var mb = 1024 * 1024;
    var html = 'OS: total ' + os.totalmem() / mb + 'MB free ' + os.freemem() / mb + 'MB<br/> process:<br />';
    for(var k in usage) {
        html += k + ': ' + (usage[k] / mb) + 'MB <br/>';
    }
    res.send(html);
};