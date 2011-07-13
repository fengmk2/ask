/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * Answer model
 */
var AnswerSchema = new Schema({
	content: String
  , question_id: {type: ObjectId, index: true}
  , author_id: {type: ObjectId}
  , like_count: {type: Number, 'default': 0}
  , create_at: {type: Date, 'default': Date.now, index: true}
  , update_at: {type: Date, 'default': Date.now}
});

mongoose.model('Answer', AnswerSchema);

