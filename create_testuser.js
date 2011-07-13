
var utils = require('./lib/utils')
  , qs = require('querystring')
  , config = require('./config');

var user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.55 Safari/535.1';

var user = {uid: '3333', username: '我是莫非文档'};
console.log(utils.strcode(user.uid + '\t' + utils.md5(user.uid), user_agent, config.session_secret));

var userdb = qs.encode({username: user.username, password: utils.md5(user.uid), uid: user.uid, usertype: 1});
userdb = utils.strcode(userdb, user_agent, config.session_secret);
var verify = utils.md5(userdb + config.session_secret);
var args = qs.encode({userdb: userdb, verify: verify});
var sync_user_url = 'http://localhost:9888/ask/api/sync_user?' + args;
console.log(sync_user_url);