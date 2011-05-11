/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question
  , Answer = models.Answer
  , User = models.User
  , common = require('./common');


exports.load = function(id, callback) {
	Answer.findById(id, callback);
};

exports.index = function(req, res){
	res.redirect('/');
};

/**
 * 创建回答
 * 
 * @return {JSON} result: {success, error, answer}
 * @api public
 */
exports.create = function(req, res, next){
	var content = req.body.content;
	var user = req.session.user;
	var answer = new Answer({content: content});
	answer.author_id = user._id;
	answer.question_id = req.question.id;
	answer.save(function(err) {
		var result = {success: true};
		if(err) {
			result.success = false;
			result.error = err.message || err;
		} else {
			result.answer = answer;
		}
		res.send(JOSN.stringify(result));
	});
};

/**
 * 保存修改的回答内容
 * 
 * @api public
 */
exports.save = function(req, res, next){
	if(!common.check_author(req, req.answer)) return res.redirect('/');
	var answer = req.answer;
	var user = req.session.user;
	answer.content = req.body.content;
	answer.author_id = user._id;
	answer.save(function(err) {
		if(err) return next(err);
		res.redirect('/question/' + question.id);
	});
};

exports.delete = function(req, res, next){
	// 只有回答作者和问题作者能删除回答
	if(!common.check_author(req, req.answer) && !common.check_author(req, req.question)) {
		return res.send(JSON.stringify({success: false, error: 'No permissions.'}));
	}
	req.answer.remove(function(err) {
		var success = true;
		if(err) {
			err = err.message || err;
			success = false;
		}
		res.send(JSON.stringify({success: success, error: err}));
	});
};

exports.my_questions = function(req, res, next) {
	if(!req.session.user) { return res.redirect('/'); }
	Question.find({author_id: req.session.user._id}, {}, 
			{sort: [['create_at', 'desc']]}, 
			function(err, questions) {
		if(err) { return next(err); }
		res.render('questions', {questions: questions});
	});
};