
function show_loading() {
	$("#pageloading").show();
};

function hide_loading() {
	$("#pageloading").hide();
};

function show_pagination(paging_ele_id, options, callback) {
    // Create pagination element
	var $page = $("#" + paging_ele_id);
	if($page.length == 0) {
		return;
	}
	options = options || {};
	var enties_num = parseInt($page.attr('total') || 0);
	options.num_edge_entries = options.num_edge_entries || 3;
	options.num_display_entries = options.num_display_entries || 5;
	options.items_per_page = options.items_per_page || 20;
	options.callback = callback;
	options.prev_text = '上一页';
	options.next_text = '下一页';
    $page.pagination(enties_num, options);
};

$(document).ready(function() {
	$(document).ready(function(){
		hide_loading();
	});
	
	if($('.question_info').length > 0) {
		// 显示分类菜单
		$.get(SITE_CONFIG.base + '/category/list', function(html) {
			$('.question_info').html(html);
		});
	}
	
	if($('.hot_user').length > 0) {
		// 显示积分榜
		$.get(SITE_CONFIG.base + '/user/hot', function(html) {
			$('.hot_user .content').html(html);
		});
	}
});