var crypto = require('crypto');

var csrf = null;

/**
 * Add csrf parameter to view (ejs example):
 * <form>
 *   <input type="hidden" name="csrf" value="<%- csrf %>" />
 * </form>
 */
exports.token = function(req, res) {
  if (!(typeof csrf !== "undefined" && csrf !== null)) {
    csrf = crypto.createHash('md5').update('' + new Date().getTime() + req.session.lastAccess).digest('hex');
    req.session.csrf = csrf;
  }
  return csrf;
};

/**
 * Express/Connect middleware function for checking csrf token. Usage:
 *
 * app.use(csrf.check());
 */
exports.check = function() {
  return function(req, res, next) {
    csrf = null; // Clear csrf for next request
    // If request is ajax, no need to check csrf.
    if (!req.xhr && req.body && req.method.toLowerCase() === 'post') {
      if (!('csrf' in req.body && req.body.csrf === req.session.csrf)) {
    	return res.send("Cross-site request forgery attempt discovered!", 403);
      }
    }
    return next();
  };
};