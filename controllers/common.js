/**
 * Module dependencies.
 */

var csrf = require('../lib/csrf');

exports.csrf_token = function(req, res) {
	return csrf.token(req, res);
};

/**
 * Check if obj author
 * 
 * @param {Object} req
 * @param {Object} obj
 * @api public
 */
exports.check_author = function(req, obj) {
	var user = req.session.user;
	if(!user || user._id != obj.author_id) {
		return false;
	}
	return true;
};

exports.check_admin = function(req) {
	var user = req.session.user;
	if(!user || !user.is_admin) {
		return false;
	}
	return true;
};

exports.json_data_response = function(err, data) {
	var result = {success: true};
	if(err) {
		result.success = false;
		result.error = err.message || err;
	} else {
		if(data) {
			result.data = data;
		}
	}
	return JSON.stringify(result);
};

var _json_no_permisssions = null;
exports.json_no_permisssions = function() {
	if(!_json_no_permisssions) {
		_json_no_permisssions = JSON.stringify({success: false, error: 'No permissions.'});
	}
	return _json_no_permisssions;
};

exports.get_paging = function(req) {
	var limit = parseInt(req.query.limit) || 20;
	if(limit > 100) {
		limit = 20;
	}
	var page_index = parseInt(req.query.page) || 0;
	if(page_index < 0) {
		page_index = 0;
	}
	return {skip: page_index * limit, limit: limit};
};
