/**
 * Module dependencies.
 */

var models = require('../models')
  , Category = models.Category
  , utils = require('../lib/utils')
  , common = require('./common');


exports.get_category = function(req, res, next) {
	Category.fetchById(req.params.id, function(err, category) {
		if(err || !category) {
			return res.send(common.json_data_response(err, category));
		}
		Category.fetchById(category.parent_id, function(err, parent) {
			if(parent) {
				category.parent = parent;
			}
			return res.send(common.json_data_response(err, category));
		});
	});
};

exports.list_category = function(req, res) {
	Category.find({show: true}, {}, {sort: [['create_at', 'asc']]}, function(err, categories) {
		if(err) { return next(err); }
		// 按parent_id 排序分类
		var sortd_categories = [];
		for(var i = 0, len = categories.length; i < len; i++) {
			var category = categories[i];
			if(category.show && !category.parent_id) {
				sortd_categories.push(category);
				category.children = [];
				for(var j = 0; j < len; j++) {
					var sub_category = categories[j];
					if(sub_category.parent_id == category.id) {
						sub_category.parent = category;
						category.children.push(sub_category);
					}
				}
			}
		}
		res.partial('category_nav', {categories: sortd_categories});
	});
};

exports.select_category = function(req, res, next) {
	Category.find({show: true}, {}, {sort: [['create_at', 'asc']]}, function(err, categories) {
		if(err) { return next(err); }
		// 按parent_id 排序分类
		var sortd_categories = [{id: '', name: '不选择'}];
		for(var i = 0, len = categories.length; i < len; i++) {
			var category = categories[i];
			if(category.show && !category.parent_id) {
				sortd_categories.push(category);
				for(var j = 0; j < len; j++) {
					var sub_category = categories[j];
					if(sub_category.parent_id == category.id) {
						sub_category.parent = category;
						sortd_categories.push(sub_category);
					}
				}
			}
		}
		res.partial('category_select', {categories: sortd_categories});
	});
};

/**
 * 获取编辑分类列表
 * 
 * @api public
 */
exports.edit_category = function(req, res, next) {
	if(!common.check_admin(req)) {
		return res.redirect('/');
	}
	Category.find({}, {}, {sort: [['create_at', 'asc']]}, function(err, categories) {
		if(err) { return next(err); }
		// 按parent_id 排序分类
		var sortd_categories = [];
		for(var i = 0, len = categories.length; i < len; i++) {
			var category = categories[i];
			category.can_delete = category.question_count <= 0;
			if(!category.parent_id) {
				sortd_categories.push(category);
				for(var j = 0; j < len; j++) {
					var sub_category = categories[j];
					if(sub_category.parent_id == category.id) {
						sub_category.parent = category;
						sortd_categories.push(sub_category);
						// 有子分类，不能删除
						category.can_delete = false;
					}
				}
			}
		}
		res.render('category_edit', {categories: sortd_categories});
	});
};

/**
 * 保存分类
 * 
 * @api public
 */
exports.save_category = function(req, res, next) {
	if(!common.check_admin(req)) {
		return res.send(common.json_no_permisssions);
	}
	var id = req.body.id;
	var name = req.body.name;
	var parent_id = req.body.parent_id;
	var parent_reader = Category.fetchById(parent_id); // 已经在执行，和下面的fetch 是并行处理的
	Category.fetchById(id, function(err, category) {
		if(err) {
			return res.send(common.json_data_response(err));
		}
		if(!category) {
			category = new Category();
		}
		var old_parent_id = category.parent_id;
		category.name = name;
		parent_reader(function(err, parent){
			if(err) {
				return res.send(common.json_data_response(err));
			}
			// 不能自己关联自己
			if(parent && parent.id != category.id) {
				category.parent_id = parent.id;
				if(old_parent_id == parent.id) {
					old_parent_id = null;
				}
			} else {
				category.parent_id = null;
			}
			category.save(function(err) {
				res.send(common.json_data_response(err, category));
				if(old_parent_id) {
					Category.total_question_count_by_id(old_parent_id);
				}
				if(parent) {
					parent.total_question_count();
				}
			});
		});
	});
};

/**
 * 切换显示或隐藏此分类
 * 
 * @api public
 */
exports.toggle_category = function(req, res) {
	var id = req.body.id;
	Category.fetchById(id, function(err, category) {
		if(!err && !category) {
			err = {message: id + ' not exists'};
		}
		if(err) {
			return res.send(common.json_data_response(err));
		}
		category.show = !category.show;
		category.save(function(err) {
			res.send(common.json_data_response(err, category));
			if(!err) {
				category.total_question_count();
			}
		});
	});
};

/**
 * 删除分类，只有当问题统计数目为0时才能删除
 * 
 * @api public
 */
exports.delete_category = function(req, res) {
	var id = req.body.id;
	Category.fetchById(id, function(err, category) {
		if(err || !category) {
			// 不存在也直接返回成功，避免点击多次
			return res.send(common.json_data_response(err));
		}
		if(category.question_count > 0) {
			var message = category.name + ' has ' + category.question_count + ', can\'t delete.';
			return res.send(common.json_data_response({message: message}));
		}
		category.remove(function(err) {
			res.send(common.json_data_response(err));
			if(!err) {
				category.total_question_count();
			}
		});
	});
};