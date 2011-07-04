/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question
  , Category = models.Category
  , Answer = models.Answer
  , User = models.User
  , common = require('./common');

var layout = 'layout_2column.html';

exports.load = function(id, callback) {
	Question.findById(id, callback);
};

exports.index = function(req, res, next) {
	var query = {};
	if(req.query.q) {
		query.title = new RegExp(req.query.q, 'i');
	}
	if(req.params.category_id) {
		query.category_id = req.params.category_id;
	}
	var is_my_question = req.query.my;
	if(is_my_question && req.session.user) {
		query.author_id = req.session.user._id;
	}
	var locals = {
		layout: layout, 
		query: req.query.q,
		is_my_question: is_my_question // 只获取我的问题
	};
	var category_reader = Category.fetchById(query.category_id);
	Question.count(query, function(err, count) {
		if(err) return next(err);
		locals.total = count;
		category_reader(function(err, category) {
			if(err) return next(err);
			locals.category = category;
			res.render('question_list', locals);
		});
	});
};

exports.paging = function(req, res, next) {
	var options = common.get_paging(req);
	options.sort = [['create_at', 'desc']];
	var query = {};
	if(req.query.q) {
		query.title = new RegExp(req.query.q, 'i');
	}
	var is_my_question = req.query.my;
	if(is_my_question && req.session.user) {
		query.author_id = req.session.user._id;
	}
	if(req.query.category_id) {
		query.category_id = req.query.category_id;
	}
	Question.find(query, {}, options, function(err, questions) {
		if(err) { return next(err); }
		common.fetch_authors(questions, function(err, questions) {
			if(err) return next(err);
			res.partial('question_list_partial', {questions: questions});
		});
	});
};
    
exports.new = function(req, res){
	var question = new Question();
	res.render('question_edit', {layout: layout, question: question, csrf: common.csrf_token(req, res)});
};

exports.show = function(req, res, next){
	var question = req.question;
	question.visit_count.increment();
	question.save();
	// 并行读取category和author
	var category_reader = Category.fetchById(question.category_id);
	var author_reader = User.fetchById(question.author_id);
	// 获取评论
	Answer.find({question_id: question.id}, {}, {sort:[['create_at', 'desc']]}, function(err, answers) {
		if(err) { return next(err); }
		// 并行读取answer的authors
		var answer_authors_reader = common.fetch_authors(answers);
		author_reader(function(err, author) {
			if(err) { return next(err); }
			question.author = author;
			var can_answer = false;
			var current_user = req.session.user;
			if(current_user) {
				can_answer = true;
				// 判断当前用户的权限
				if(current_user._id == question.author_id) {
					question.editable = true;
				}
				for(var i = 0, len = answers.length; i < len; i++) {
					var answer = answers[i];
					if(current_user._id == answer.author_id) {
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
					res.render('question', 
						{layout: layout, question: question, answers: answers, can_answer: can_answer});
				});
			});
		});
	});
};

exports.edit = function(req, res){
	if(!common.check_author(req, req.question)) return res.redirect('/');
	Category.fetchById(req.question.category_id, function(err, category) {
		if(err) return next(err);
		req.question.category = category;
		res.render('question_edit', {layout: layout, question: req.question, csrf: common.csrf_token(req, res)});
	});
};

exports.create = function(req, res, next) {
	var user = req.session.user;
	if(!user || !user._id) {
		return res.redirect('/');
	}
	var title = req.body.title
	  , category_id = req.body.category_id
	  , content = req.body.content;
	var question = new Question({title: title, content: content});
	var category_reader = null;
	if(category_id) {
		question.category_id = category_id;
		category_reader = Category.fetchById(category_id);
	}
	User.findById(user._id, function(err, author) {
		question.author_id = author.id;
		question.end_at = question.close_at;
		question.save(function(err) {
			if(err) return next(err);
			// 增加用户积分
			author.question_count.increment();
			author.score.increment(10);
			author.save();
			req.session.user = author;
			if(category_reader) {
				category_reader(function(err, category) {
					category.total_question_count();
				});
			}
			res.redirect('/question/' + question.id);
		});
	});
};

exports.save = function(req, res, next){
	if(!common.check_author(req, req.question)) return res.redirect('/');
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

exports.delete = function(req, res, next){
	if(!common.check_author(req, req.question)) {
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
			req.session.user = author;
			res.send(common.json_data_response());
		});
	});
};
