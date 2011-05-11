/**
 * Module dependencies.
 */

var models = require('../models')
  , Question = models.Question;


exports.index = function(req, res, next) {
	res.cookie('ask.authuser', 'CTsBUAVZAwJWXldSWwEGAwoBCFYBB1MIDlFTAAFXAQwNUg==');
	Question.find({}, {}, {limit: 20, sort: [['create_at', 'desc']]}, function(err, questions) {
		if(err) { return next(err); }
		Question.fetch_authors(questions, function(err, questions) {
			if(err) return next(err);
			res.render('index', {questions: questions});
		});
	});
};
