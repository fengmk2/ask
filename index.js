/**
 * Module dependencies.
 */

require.paths.unshift('./support');
require('./public/js/lang');

var express = require('express')
  , Resource = require('express-resource')
  , csrf = require('./lib/csrf')
  , config = require('./config')
  , models = require('./models');

Resource.prototype._mapDefaultAction = Resource.prototype.mapDefaultAction;
Resource.prototype.mapDefaultAction = function(key, fn){
    switch (key) {
        case 'save':
            this.post(fn);
            break;
        case 'delete':
            this.post('delete', fn);
            break;
    }
    this._mapDefaultAction(key, fn);
};

var app = module.exports = express.createServer();
if(app.dynamicHelpers) { // new version express
    app.dynamicLocals = app.dynamicHelpers;
    app.locals = app.helpers; 
}
app.dynamicLocals({
  base: function(){
    // return the app's mount-point
    // so that urls can adjust. For example
    // if you run this example /post/add works
    // however if you run the mounting example
    // it adjusts to /blog/post/add
    return '/' == app.route ? '' : app.route;
  }
}).locals({
	pro_login_url: config.pro_login_url,
	std_login_url: config.std_login_url
});

/**
 * Views settings
 */
app.set("view engine", "html");
app.set("views", __dirname + '/views/cubex');
//app.set('view options', {
//    layout: 'layout'
//});
var ejs = require('ejs');
app.register(".html", ejs);
// add more filters
var filters = require('./lib/filters');
for(var k in filters) {
	ejs.filters[k] = filters[k];
}

var static_dir = __dirname + '/public';
app.configure('development', function(){
    app.use(express.static(static_dir));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.logger());
    var oneYear = 31557600000;
    app.use(express.static(static_dir, { maxAge: oneYear }));
    app.use(express.errorHandler());
    app.set('view cache', true);
});

/**
 * Middleware settings: bodyParser, cookieParser, session
 */
app.configure(function(){
	app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
    	secret: config.session_secret
      //, store: store
    }));
    
});
app.use(csrf.check());

var user_control = require('./controllers/user');
app.use(user_control.user_middleware);

// ask control
var ask_control = require('./controllers/ask');
app.resource(ask_control);

// category control
var category_control = require('./controllers/category');
app.get('/category/list', category_control.list_category);
app.get('/category/select', category_control.select_category);
app.get('/category/edit', category_control.edit_category);
app.post('/category/save', category_control.save_category);
app.post('/category/delete', category_control.delete_category);
app.post('/category/toggle', category_control.toggle_category);
app.get('/category/:id/json', category_control.get_category);

var question_control = require('./controllers/question');
app.get('/category/:category_id', question_control.index);
app.post('/question/:qid/focus', question_control.focus);
app.post('/question/:qid/unfocus', question_control.unfocus);
var question_resource = app.resource('question', question_control);

var answer_resource = app.resource('answer', require('./controllers/answer'));
question_resource.add(answer_resource);

// user control
app.get('/user/hot', user_control.get_hot_users);
app.post('/user/:user_id/follow', user_control.follow);
app.post('/user/:user_id/unfollow', user_control.unfollow);
app.get('/user/:user_id/followers', user_control.followers);
app.get('/user/:user_id/following', user_control.following);

app.resource('user', user_control);
app.get('/api/sync_user', user_control.sync_user);
app.post('/api/sync_user', user_control.sync_user);


if (!module.parent) {
	app.listen(config.port);
	console.log('Express started on port ' + config.port);
	console.log((process.env.NODE_ENV || 'development') + ' env');
}