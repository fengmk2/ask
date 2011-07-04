/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , future = require('../lib/future');

/**
 * Category Schema
 */
var CategorySchema = new Schema({
	name: {type: String, index: true}
  , parent_id: {type: ObjectId, index: true}
  , show: {type: Boolean, default: true}
  , question_count: {type: Number, default: 0}
});

CategorySchema.method('total_question_count', function() {
	Category.total_question_count_by_id(this.id);
	if(this.parent_id) {
		Category.total_question_count_by_id(this.parent_id);
	}
});

CategorySchema.static('total_question_count_by_id', function(id) {
	Category.find({parent_id: id, show: true}, function(err, children){
		var ids = [id];
		for(var i = 0, len = children.length; i < len; i++) {
			ids.push(children[i].id);
		}
		var Question = mongoose.model('Question');
		Question.count({category_id: {$in: ids}}, function(err, total) {
			if(!err) {
				Category.update({_id: id}, {question_count: total}, function() {});
			}
		});
	});
});

mongoose.model('Category', CategorySchema);

var Category = module.exports = mongoose.model('Category');