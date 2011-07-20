/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , future = require('../lib/future').future;

/**
 * Finds by id, when id is null or empty string, will callback(null, null)
 * 
 * @param {ObjectId} id
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

/**
 * Finds by ids, when ids is null or empty array, will callback(null, null)
 * 
 * @param {Array} ids
 * @api public
 */
mongoose.Model._fetchByIds = function(ids, fields, options, callback) {
	if(ids && ids.length > 0) {
		this.find({_id: {'$in': ids}}, fields, options, function(err, docs) {
			var map = {};
			if(docs) {
				for(var i = 0, len = docs.length; i < len; i++) {
					var doc = docs[i];
					map[doc.id] = doc;
				}
			}
			callback(err, map);
		});
	} else {
		callback(null, null);
	}
};

mongoose.Model.fetchByIds = function(ids, fields, options, callback) {
	if ('function' == typeof fields) {
	    callback = fields;
	    fields = null;
	    options = null;
	} else if ('function' == typeof options) {
	    callback = options;
	    options = null;
	}
	if(!callback) {
		return future.call(this, this._fetchByIds, [ids, fields, options]);
	}
	return this._fetchByIds(ids, fields, options, callback);
};

mongoose.Model._fetchByQuery = function(query, fields, options, callback) {
    if(query) {
        this.find(query, fields, options, callback);
    } else {
        callback(null, null);
    }
};

mongoose.Model.fetchByQuery = function(query, fields, options, callback) {
    if ('function' == typeof fields) {
        callback = fields;
        fields = null;
        options = null;
    } else if ('function' == typeof options) {
        callback = options;
        options = null;
    }
    if(!callback) {
        return future.call(this, this._fetchByQuery, [query, fields, options]);
    }
    return this._fetchByQuery(query, fields, options, callback);
};

mongoose.Model.__count = mongoose.Model.count;
mongoose.Model.count = function(query, callback) {
    if(!callback) {
        return future.call(this, this.__count, [query]);
    }
    return this.__count(query, callback);
};

require('./log');
require('./user');
require('./category');
require('./question');
require('./answer');
require('./relation');
require('./focus');

mongoose.connect('mongodb://127.0.0.1/ask', function(err) {
    if(err) {
        console.error('connect to db error: ' + err.message);
        process.exit(1);
    }
});

exports.Question = mongoose.model('Question');
exports.Answer = mongoose.model('Answer');
exports.Category = mongoose.model('Category');
exports.User = mongoose.model('User');
exports.Relation = mongoose.model('Relation');
exports.Log = mongoose.model('Log');
exports.Focus = mongoose.model('Focus');