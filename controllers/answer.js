/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question
  , Answer = models.Answer
  , User = models.User
  , Log = models.Log
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
exports.create = function(req, res, next) {
	var user = req.session.user;
	if(!user) {
		return res.send(common.json_no_permisssions());
	}
	var content = req.body.content;
	var question = req.question;
	var answer = new Answer({content: content});
	var user_reader = User.fetchById(user._id);
	answer.author_id = user._id;
	answer.question_id = question.id;
	answer.save(function(err) {
		if(!err) {
			// 增加评论统计
			question.answer_count.increment();
			question.save(function() {});
			user_reader(function(err, user) {
				if(user) {
					user.increment_answer(1);
					user.save();
				}
			});
			// 记录日志
			var log = new Log({action: 'answer', target_id: answer.id, 
				title: answer.content, user_id: answer.author_id, 
				target_parent_id: question.id,
				target_parent_title: question.title});
			log.save(function(err) {
				console.log(err);
			});
		}
		res.send(common.json_data_response(err, answer));
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
		res.send(common.json_data_response(err, answer));
	});
};

exports.delete = function(req, res, next){
	// 只有回答作者能删除回答
	if(!common.check_author(req, req.answer)) {
		return res.send(common.json_no_permisssions());
	}
	var user_reader = User.fetchById(req.answer.author_id);
	req.answer.remove(function(err) {
		if(!err) {
			req.question.answer_count.decrement();
			if(req.question.answer_count < 0) {
				req.question.answer_count = 0;
			}
			req.question.save();
			user_reader(function(err, user){
				if(user) {
					user.increment_answer(-1);
					user.save();
				}
			});
		}
		res.send(common.json_data_response(err));
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