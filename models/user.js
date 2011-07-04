/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * User model
 */
var UserSchema = new Schema({
	name: {type: String, index: true}
  , uid: {type: String, unique: true}
  , password: String
  , type: Number
  , score: {type: Number, default: 0, index: true} // 积分
  , question_count: {type: Number, default: 0}
  , answer_count: {type: Number, default: 0}
  , info: {type: {}, default: Object}
  , setting: {type: {}, default: Object}
  , is_admin: {type: Boolean, default: false}
  , create_at: {type: Date, default: Date.now}
  , update_at: {type: Date, default: Date.now}
});

UserSchema.method('_increment_count', function(count, per_score, name) {
	this[name].increment(count);
	if(this[name] < 0) {
		this[name] = 0;
	}
	this.score.increment(count * per_score);
	if(this.score < 0) {
		this.score = 0;
	}
});
// 增加问题数量
UserSchema.method('increment_question', function(count) {
	this._increment_count(count, 10, 'question_count');
});

// 增加回答数量
UserSchema.method('increment_answer', function(count) {
	this._increment_count(count, 5, 'answer_count');
});

UserSchema.static('fetchByIds', function(ids, callback) {
	this.find({_id: {$in: ids}}, function(err, users) {
		var map = {};
		if(users) {
			for(var i = 0, len = users.length; i < len; i ++) {
				var user = users[i];
				map[user.id] = user;
			}
		}
		callback(err, map);
	});
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');