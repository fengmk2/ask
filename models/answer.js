/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * Answer model
 */
var Answer = new Schema({
	content: String
  , question_id: {type: ObjectId, index: true}
  , create_at: {type: Date, default: Date.now, index: true}
  , update_at: {type: Date, default: Date.now}
});
mongoose.model('Answer', Answer);

