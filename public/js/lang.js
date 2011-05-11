
// format datetime, demo: new Date().format("yyyy-MM-dd hh:mm:ss");
Date.prototype.format = function(format) {
	format = format || "yyyy-MM-dd hh:mm:ss";
	var o = {
		"M+" : this.getMonth()+1, //month
		"d+" : this.getDate(),    //day
		"h+" : this.getHours(),   //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth()+3)/3), //quarter
		"S" : this.getMilliseconds() //millisecond
	};
	if(/(y+)/.test(format)) {
		format=format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	}

	for(var k in o) {
		if(new RegExp("("+ k +")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		}
	}
	return format;
};

// 至今剩余多少时间
Date.prototype.timeleft = function(day, hour, minute) {
	day = day || ' 天 ';
	hour = hour || ' 小时 ';
	minute = minute || ' 分钟 ';
	var left_time = this.getTime() - new Date().getTime();
	var days = left_time / (24 * 3600000);
	var hours = (days - Math.floor(days)) * 24;
	var minutes = (hours - Math.floor(hours)) * 60;
	return Math.floor(days) + day + Math.floor(hours) + hour + Math.ceil(minutes) + minute;
};