/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , User = require('./user')
  , future = require('../lib/future');

/**
 * Category Schema
 */
var CategorySchema = new Schema({
	name: {type: String, index: true}
  , parent_id: ObjectId
  , show: {type: Boolean, default: true}
  , question_count: {type: Number, default: 0}
});
mongoose.model('Category', CategorySchema);

/**
 * Question schema
 */
var QuestionSchema = new Schema({
	title: {type: String, index: true}
  , author_id: ObjectId
  , content: String
  , tags: [String]
  , category_id: ObjectId
  , best_answer_id: ObjectId
  , visit_count: {type: Number, default: 0}
  , answer_count: {type: Number, default: 0}
  , end_at: {type: Date}
  , create_at: {type: Date, default: Date.now, index: true}
  , update_at: {type: Date, default: Date.now}
});

QuestionSchema.virtual('close_at').get(function() {
	return this.end_at ? this.end_at : new Date(this.create_at.getTime() + 24 * 3600000 * 15);
});

/**
 * 加载关联的author数据
 * 
 * @api public
 */
QuestionSchema.static('fetch_authors', function(questions, callback) {
	var ids = {};
	for(var i = 0, len = questions.length; i < len; i ++) {
		var question = questions[i];
		if(question.author_id && !ids[question.author_id]) {
			ids[question.author_id] = 1;
		}
	}
	User.find({_id: {$in: Object.keys(ids)}}, function(err, users) {
		var map = {};
		for(var i = 0, len = users.length; i < len; i ++) {
			var user = users[i];
			map[user.id] = user;
		}
		for(var i = 0, len = questions.length; i < len; i ++) {
			var question = questions[i];
			question.author = map[question.author_id];
		}
		callback(err, questions);
	});
});
mongoose.model('Question', QuestionSchema);
