/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question
  , Category = models.Category
  , Answer = models.Answer
  , User = models.User
  , Log = models.Log
  , Focus = models.Focus
  , EventProxy = require('../lib/eventproxy').EventProxy
  , common = require('./common');

exports.load = function(id, callback) {
	Question.findById(id, callback);
};

function get_focus_qids(req, callback) {
    Focus.find({uid: req.session.user_id}, ['qid'], function(err, items) {
        if(err) { return callback(err); }
        var qids = {};
        for(var i = 0, len = items.length; i < len; i++) {
            qids[items[i].qid] = 1;
        }
        callback(null, qids);
    });
};

function find_questions(req, query, callback) {
    var max_datetime = req.query.max;
    if(max_datetime) {
        query.create_at = {$lt: new Date(max_datetime)};
    }
    // 先获取问题，然后加载用户数据
    Question.find(query, {}, {limit: 20, sort: [['create_at', 'desc']]}, function(err, questions) {
        if(err) { return callback(err); }
        var uids = [];
        for(var i = 0, len = questions.length; i < len; i++) {
            var question = questions[i];
            uids.push(question.author_id);
        }
        User.fetchByIds(uids, function(err, users) {
            if(!err) {
                for(var i = 0, len = questions.length; i < len; i++) {
                    var question = questions[i];
                    question.user = users[question.author_id];
                }
            }
            callback(err, questions);
        });
    });
};

exports.index = function(req, res, next) {
    var max_datetime = req.query.max, focus = req.query.focus === '1';
    var query = {};
    if(max_datetime) {
        query.create_at = {$lt: new Date(max_datetime)};
    }
    get_focus_qids(req, function(err, map_qids) {
        if(err) { return next(err); }
        if(focus) {
            // TODO 关注过多会有问题
            query._id = {'$in': Object.keys(map_qids)};
        }
        if(req.query.q) {
            try {
                query.title = new RegExp(req.query.q, 'i');
            } catch(e) {
                // TODO log error?
            }
        }
        find_questions(req, query, function(err, questions) {
            if(err) { return next(err); }
            for(var i = 0, len = questions.length; i < len; i++) {
                var question = questions[i];
                if(map_qids[question.id]) {
                    question.focus = true;
                }
            }
            if(req.xhr) {
                res.partial('question/question', questions);
            } else {
                res.render('question/list', {questions: questions, query: req.query.q, focus: focus});
            }
        });
    });
};

exports.list_questions_by_category = function(req, res, next) {
    var category_id = req.params.category_id;
    var event = new EventProxy();
    event.assign('category', 'questions', function(category, questions) {
        if(req.xhr) {
            res.partial('question/question', questions);
        } else {
            res.render('question/list', {questions: questions, category: category});
        }
    });
    event.on('category_ids', function(category_ids) {
        find_questions(req, {category_id: {$in: category_ids}}, function(err, questions) {
            if(err) { return event.emit('error', err); }
            // 如果当前用户已登录，则判断问题是否已关注
            if(req.session.user_id && questions && questions.length > 0) {
                var qids = {};
                for(var i = 0, len = questions.length; i < len; i++) {
                    var q = questions[i];
                    qids[q.id] = q;
                }
                Focus.find({qid: {$in: Object.keys(qids)}, uid: req.session.user_id}, function(err, focuses) {
                    if(focuses) {
                        for(var i = 0, len = focuses.length; i < len; i++) {
                            qids[focuses[i].qid].focus = true;
                        }
                    }
                    event.emit('questions', questions);
                });
            } else {
                event.emit('questions', questions);
            }
        });
    });
    event.on('error', function(err) {
        event.removeAllListeners();
        next(err);
    });
    // 先获取分类及其子分类
    Category.findOne({_id: category_id}, function(err, category) {
        if(err) { return event.emit('error', err); }
        if(!category) {
            return res.redirect('/');
        }
        event.emit('category', category);
        var category_ids = [category.id];
        Category.find({parent_id: category_id}, function(err, children) {
            if(err) { return event.emit('error', err); }
            if(children) {
                for(var i = 0, len = children.length; i < len; i++) {
                    var child = children[i];
                    category_ids.push(child.id);
                }
            }
            event.emit('category_ids', category_ids);
        });
    });
};

exports.new = function(req, res) {
	var question = new Question();
	res.render('question/edit', {question: question, csrf: common.csrf_token(req, res)});
};

exports.show = function(req, res, next){
	var question = req.question;
	question.visit_count.increment();
	question.save();
	question.editable = common.check_editable(req, question);
	// 并行读取category和author
	var category_reader = Category.fetchById(question.category_id);
	var author_reader = User.fetchById(question.author_id);
	var focus_reader = Focus.fetchByQuery({qid: question.id, uid: req.session.user_id});
	// 获取评论
	Answer.find({question_id: question.id}, {}, {sort:[['create_at', 'desc']]}, function(err, answers) {
		if(err) { return next(err); }
		// 并行读取answer的authors
		var answer_authors_reader = common.fetch_authors(answers);
		author_reader(function(err, author) {
			if(err) { return next(err); }
			question.author = author;
			var can_answer = false;
			var user_id = req.session.user_id;
			if(user_id) {
				can_answer = true;
				// 判断当前用户的权限
				if(user_id == question.author_id) {
					question.editable = true;
				}
				for(var i = 0, len = answers.length; i < len; i++) {
					var answer = answers[i];
					answer.editable = common.check_editable(req, answer);
					if(user_id == answer.author_id) {
						answer.editable = true;
						can_answer = false; // 已经回答过
					}
				}
			}
			category_reader(function(err, category) {
				if(err) { return next(err); }
				question.category = category;
				answer_authors_reader(function(err, answers) {
					if(err) { return next(err); }
					focus_reader(function(err, focus) {
					    if(err) { return next(err); }
					    if(focus && focus.length > 0) {
					        question.focus = true;
					    }
					    res.render('question/detail', 
		                        {question: question, answers: answers, can_answer: can_answer});
					});
				});
			});
		});
	});
};

exports.edit = function(req, res){
	if(!common.check_editable(req, req.question)) {
	    return res.redirect('/');
	}
	Category.fetchById(req.question.category_id, function(err, category) {
		if(err) return next(err);
		req.question.category = category;
		res.render('question/edit', {question: req.question, csrf: common.csrf_token(req, res)});
	});
};

exports.create = function(req, res, next) {
	var user_id = req.session.user_id;
	if(!user_id) {
		return res.redirect('/');
	}
	var title = req.body.title
	  , category_id = req.body.category_id
	  , content = req.body.content
	  , question = new Question({title: title.only_text(), content: content.only_text()})
	  , category_reader = null;
	if(category_id) {
		question.category_id = category_id;
		category_reader = Category.fetchById(category_id);
	}
	User.findById(user_id, function(err, author) {
		question.author_id = author.id;
		question.end_at = question.close_at;
		question.save(function(err) {
			if(err) return next(err);
			// 增加用户积分
			author.increment_question(1);
			author.save();
			if(category_reader) {
				category_reader(function(err, category) {
					category.total_question_count();
				});
			}
			// 记录日志
			var log = new Log({action: 'question', target_id: question.id, 
				title: question.title, user_id: question.author_id});
			log.save(function(err) {
				if(err) return next(err);
				res.redirect('/question/' + question.id);
			});
		});
		
	});
};

exports.save = function(req, res, next) {
	if(!common.check_editable(req, req.question)) {
	    return res.redirect('/');
	}
	var question = req.question;
	var user = req.session.user;
	question.title = req.body.title;
	question.content = req.body.content;
	var category_id = req.body.category_id;
	var old_category_reader = null
	  , new_category_reader = null;
	if(question.category_id != category_id) {
		if(question.category_id) {
			// 原有分类需要减1
			old_category_reader = Category.fetchById(question.category_id);
		}
		if(category_id) {
			new_category_reader = Category.fetchById(category_id);
		}
	}
	question.category_id = category_id || null;
	question.author_id = user._id;
	question.title = question.title.only_text();
    if(question.content) {
        question.content = question.content.only_text();
    }
	question.save(function(err) {
		if(err) return next(err);
		if(old_category_reader) {
			old_category_reader(function(err, category){
				if(category) {
					category.total_question_count();
				}
			});
		}
		if(new_category_reader) {
			new_category_reader(function(err, category){
				if(category) {
					category.total_question_count();
				}
			});
		}
		res.redirect('/question/' + question.id);
	});
};

exports.delete = function(req, res, next) {
	if(!common.check_editable(req, req.question)) {
		return res.send(common.json_no_permisssions);
	}
	User.findById(req.session.user._id, function(err, author) {
		req.question.remove(function(err) {
			if(err) return res.send(common.json_data_response(err));
			// 删除用户积分
			author.question_count.decrement();
			if(author.question_count < 0) {
				author.question_count = 0;
			}
			author.score.increment(-10);
			if(author.score < 0) {
				author.score = 0;
			}
			author.save();
			res.send(common.json_data_response());
		});
	});
};


// /question/:qid/focus
exports.focus = function(req, res) {
    var qid = req.params.qid, uid = req.session.user_id;
    Focus.findOne({qid: qid, uid: uid}, function(err, focus) {
        if(err) { return res.send(common.json_data_response(err)); }
        if(!focus) {
            focus = new Focus();
        }
        focus.qid = qid;
        focus.uid = uid;
        focus.save(function(err) {
            res.send(common.json_data_response(err, {focus: focus}));
        });
    });
};

exports.unfocus = function(req, res) {
    var qid = req.params.qid, uid = req.session.user_id;
    Focus.remove({uid: uid, qid: qid}, function(err) {
        res.send(common.json_data_response(err));
    });
};