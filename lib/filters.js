
/**
 * 自动切割过长的字符串
 */
exports.fixed_string = function(str, len) {
    str = String(str);
    if(str.length > len) {
        str = str.substr(0, len - 6) + '......';
    }
    return str;
};

var _actions = {
	'question': '添加了该问题',
	'answer': '回答了该问题',
};
/**
 * 用户操作的名称
 */
exports.action_name = function(action) {
	return _actions[action] || '捣蛋了';
};