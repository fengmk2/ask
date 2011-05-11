/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question
  , User = models.User
  , common = require('./common');

var layout = 'layout_2column.html';

exports.load = function(id, callback) {
	Question.findById(id, callback);
};

exports.index = function(req, res) {
	var query = {};
	if(req.query.q) {
		query['title'] = new RegExp(req.query.q, 'i');
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
	Question.count(query, function(err, count) {
		locals.total = count;
		res.render('question_list', locals);
	});
};

exports.paging = function(req, res, next) {
	var options = common.get_paging(req);
	options.sort = [['create_at', 'desc']];
	var query = {};
	if(req.query.q) {
		query['title'] = new RegExp(req.query.q, 'i');
	}
	var is_my_question = req.query.my;
	if(is_my_question && req.session.user) {
		query.author_id = req.session.user._id;
	}
	Question.find(query, {}, options, function(err, questions) {
		if(err) { return next(err); }
		Question.fetch_authors(questions, function(err, questions) {
			if(err) return next(err);
			res.partial('question_list_partial', {questions: questions});
		});
	});
};
    
exports.new = function(req, res){
	var question = new Question();
	res.render('question_edit', {layout: layout, question: question, csrf: common.csrf_token(req, res)});
};

exports.show = function(req, res){
	var question = req.question;
	User.findById(question.author_id, function(err, user) {
		question.author = user;
		question.visit_count.increment();
		question.save();
		res.render('question', {layout: layout, question: question});
	});
};

exports.edit = function(req, res){
	if(!common.check_author(req, req.question)) return res.redirect('/');
	res.render('question_edit', {layout: layout, question: req.question, csrf: common.csrf_token(req, res)});
};

exports.create = function(req, res, next){
	var title = req.body.title
	  , content = req.body.content;
	var user = req.session.user;
	var question = new Question({title: title, content: content});
	question.author_id = user._id;
	question.end_at = question.close_at;
	question.save(function(err) {
		if(err) return next(err);
		res.redirect('/question/' + question.id);
	});
};

exports.save = function(req, res, next){
	if(!common.check_author(req, req.question)) return res.redirect('/');
	var question = req.question;
	var user = req.session.user;
	question.title = req.body.title;
	question.content = req.body.content;
	question.author_id = user._id;
	question.save(function(err) {
		if(err) return next(err);
		res.redirect('/question/' + question.id);
	});
};

exports.delete = function(req, res, next){
	if(!common.check_author(req, req.question)) {
		return res.send(common.json_no_permisssions);
	}
	req.question.remove(function(err) {
		res.send(common.json_data_response(err));
	});
};
