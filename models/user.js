/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * User model
 */
var User = new Schema({
	name: {type: String, index: true}
  , uid: {type: String, unique: true}
  , password: String
  , type: Number
  , info: {type: {}, default: Object}
  , setting: {type: {}, default: Object}
  , is_admin: {type: Boolean, default: false}
  , create_at: {type: Date, default: Date.now}
  , update_at: {type: Date, default: Date.now}
});
mongoose.model('User', User);

module.exports = mongoose.model('User');