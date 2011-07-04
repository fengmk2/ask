/**
 * Module dependencies.
 */

require.paths.unshift('./support');
require('./public/js/lang');

var express = require('express')
  , resource = require('express-resource')
  , csrf = require('./lib/csrf')
  , config = require('./config')
  , models = require('./models');

var app = express.createServer();

/**
 * Views settings
 */
app.set("view engine", "html");
app.set("views", __dirname + '/views/cubex');
//app.set('view options', {
//    layout: __dirname + '/views/layout'
//});
var ejs = require('ejs');
ejs.it = true;
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
    app.use(csrf.check());
});

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
app.get('/question/paging', question_control.paging);
var question_resource = app.resource('question', question_control);

var answer_resource = app.resource('answer', require('./controllers/answer'));
question_resource.add(answer_resource);

// user control
app.get('/user/hot', user_control.get_hot_users);
app.resource('user', user_control);
app.get('/api/sync_user', user_control.sync_user);
app.post('/api/sync_user', user_control.sync_user);


app.listen(config.port);
console.log('http://localhost:' + config.port);
console.log((process.env.NODE_ENV || 'development') + ' env');