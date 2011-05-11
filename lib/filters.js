
/**
 * 自动切割过长的字符串
 */
exports.fixed_string = function(str, len){
  str = String(str);
  if(str.length > len) {
	  str = str.substr(0, len - 3) + '...';
  }
  return str;
};