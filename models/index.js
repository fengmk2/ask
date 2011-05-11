/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , future = require('../lib/future').future;

/**
 * Finds by id, when id is null or empty string, will callback(null, null)
 * 
 * @param {ObjectId/Object} id
 * @api public
 */
mongoose.Model._fetchById = function(id, fields, options, callback) {
	if(id) {
		this.findOne({_id: id}, fields, options, callback);
	} else {
		callback(null, null);
	}
};

mongoose.Model.fetchById = function(id, fields, options, callback) {
	if ('function' == typeof fields) {
	    callback = fields;
	    fields = null;
	    options = null;
	} else if ('function' == typeof options) {
	    callback = options;
	    options = null;
	}
	if(!callback) {
		return future.call(this, this._fetchById, [id, fields, options]);
	}
	return this._fetchById(id, fields, options, callback);
};

require('./user');
require('./question');
require('./answer');

mongoose.connect('mongodb://localhost/ask');

exports.Question = mongoose.model('Question');
exports.Answer = mongoose.model('Answer');
exports.Category = mongoose.model('Category');
exports.User = mongoose.model('User');
