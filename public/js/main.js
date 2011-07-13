
function show_loading() {
	$("#pageloading").show();
};

function hide_loading() {
	$("#pageloading").hide();
};

$(document).ready(function() {
    hide_loading();
    
    $('#pageloading').ajaxStart(function() {
        $(this).show();
    }).ajaxStop(function() {
        $(this).hide();
    });
    
    // 关注问题
    $('.button_focus').live('click', function() {
        var method = 'focus', $me = $(this), text = '取消关注';
        if($me.hasClass('unfocus')) {
            method = 'unfocus';
            text = '关注';
        }
        var qid = $me.attr('qid');
        $.post(SITE_CONFIG.base + '/question/' + qid + '/' + method, function(data) {
            if(data.success) {
                $('.button_focus_' + qid).toggleClass('unfocus').html(text);
                if($me.hasClass('button_green') || $me.hasClass('button_white')) {
                    $me.toggleClass('button_white').toggleClass('button_green');
                }
            } else {
                alert(data.error);
            }
        }, 'json');
    });
    
    // 关注用户
    $('.button_follow').live('click', function() {
        var method = 'follow', $me = $(this), text = '取消关注';
        if($me.hasClass('unfollow')) {
            method = 'unfollow';
            text = '关注';
        }
        var uid = $me.attr('uid');
        $.post(SITE_CONFIG.base + '/user/' + uid + '/' + method, function(data) {
            if(data.success) {
                $('.button_follow_' + uid).toggleClass('unfollow').toggleClass('button_green').toggleClass('button_white').html(text);
            } else {
                alert(data.error);
            }
        }, 'json');
    });
    
    // 加载更多数据
    $('#load_more').click(function() {
        var $parent = $(this).parent();
        var max_datetime = $parent.prev().find('.datetime').html();
        $.get(window.location.href, {max: max_datetime}, function(html) {
            if(html) {
                $parent.before(html);
            } else {
                $parent.remove();
            }
        });
    });
});
