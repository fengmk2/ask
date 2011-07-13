/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

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
  , status: {type: Number, 'default': 0} // 0: 未解决 1: 解决 2: 无最佳答案
  , visit_count: {type: Number, 'default': 0}
  , answer_count: {type: Number, 'default': 0}
  , focus_count: {type: Number, 'default': 0}
  , end_at: {type: Date}
  , create_at: {type: Date, 'default': Date.now, index: true}
  , update_at: {type: Date, 'default': Date.now}
});

//QuestionSchema.virtual('close_at').get(function() {
//	return this.end_at ? this.end_at : new Date(this.create_at.getTime() + 24 * 3600000 * 15);
//});

mongoose.model('Question', QuestionSchema);
