
var utils = require('./lib/utils')
  , qs = require('querystring')
  , config = require('./config');

var user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.30 Safari/534.30';


console.log(utils.strcode('1\t' + utils.md5('1'), user_agent, config.session_secret));

var userdb = qs.encode({username: '苏千', password: utils.md5('1'), uid: 1, usertype: 1});
var verify = utils.md5(userdb + config.session_secret);
userdb = utils.strcode(userdb, user_agent, config.session_secret);
var args = qs.encode({userdb: userdb, verify: verify});
var sync_user_url = 'http://localhost:3000/api/sync_user?' + args;
console.log(sync_user_url);