
var utils = require('./lib/utils')
  , qs = require('querystring')
  , config = require('./config');

var user_agent = 'Mozilla/5.0 (Windows NT 6.1; rv:5.0) Gecko/20100101 Firefox/5.0';

var user = {uid: '淘宝数据魔方', username: '淘宝数据魔方'};
var user = {uid: '我不是管理员', username: '我不是管理员'};
console.log(utils.strcode(user.uid + '\t' + utils.md5(user.uid), user_agent, config.session_secret));

var userdb = qs.encode({username: user.username, password: utils.md5(user.uid), uid: user.uid, usertype: 1});
userdb = utils.strcode(userdb, user_agent, config.session_secret);
var verify = utils.md5(userdb + config.session_secret);
var args = qs.encode({userdb: userdb, verify: verify});
var sync_user_url = 'http://localhost:9888/ask/api/sync_user?' + args;
console.log(sync_user_url);