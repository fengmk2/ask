/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * User Relation model
 */
var RelationSchema = new Schema({
	uid: {type: ObjectId, index: true}
  , fid: {type: ObjectId, index: true} // fid ==follow==> uid
  , each_other: {type: Number, default: 0} // 1 相互关注
  , create_at: {type: Date, default: Date.now}
});

mongoose.model('Relation', RelationSchema);

module.exports = mongoose.model('Relation');