/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * Focus Question model
 */
var FocusSchema = new Schema({
    qid: {type: ObjectId, index: true}
  , uid: {type: ObjectId, index: true} // uid ==focus==> qid
  , create_at: {type: Date, default: Date.now}
});

mongoose.model('Focus', FocusSchema);

module.exports = mongoose.model('Focus');