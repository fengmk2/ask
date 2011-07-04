/**
 * Module dependencies.
 */

var models = require('../models')
  , common = require('./common')
  , Question = models.Question;


exports.index = function(req, res, next) {
	Question.find({}, {}, {limit: 20, sort: [['create_at', 'desc']]}, function(err, questions) {
		if(err) { return next(err); }
		res.render('index', {questions: questions});
	});
};
