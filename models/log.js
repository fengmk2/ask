/**
 * log everything about question
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var LogSchema = new Schema({
	action: {type: String} // question, answer, focus, unfocus, follow, unfollow
  , target_id: {type: ObjectId, index: true}
  , title: {type: String}
  , target_parent_id: {type: ObjectId}
  , target_parent_title: {type: String}
  , user_id: {type: ObjectId, index: true}
  , create_at: {type: Date, 'default': Date.now, index: true}
});

mongoose.model('Log', LogSchema);
module.exports = mongoose.model('Log');
