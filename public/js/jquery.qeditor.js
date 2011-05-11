/* 
 * QEditor
 *
 * This is a simple Rich Editor for web application, clone from Quora.
 * Author: 
 *  Jason Lee <huacnlee@gmail.com>
 *
 * Using:
 *
 *    $("textarea").qeditor();
 *
 * and then you need filt the html tags,attributes in you content page.
 * In Rails application, you can use like this:
 * 
 *    <%= sanitize(@post.body,:tags => %w(strong b i u strike ol ul li address blockquote br div), :attributes => %w(src)) %>
 *
 */
var QEDITOR_TOOLBAR_HTML = '\<div class="qeditor_toolbar"> \
  <a href="#" onclick="return QEditor.action(this,\'bold\');" title="加粗"><b>B</b></a> \
  <a href="#" onclick="return QEditor.action(this,\'italic\');" title="倾斜"><i>I</i></a> \
  <a href="#" onclick="return QEditor.action(this,\'underline\');" title="下划线"><u>U</u></a> \
  <a href="#" class="qeditor_glast" onclick="return QEditor.action(this,\'strikethrough\');" title="删除线" alt="删除线"><strike>S</strike></a>		 \
  <a href="#" style="display:none;" onclick="return QEditor.action(this,\'formatBlock\',\'address\');"><img src="/images/qeditor/quote.gif" title="引用" alt="引用" /></a> \
  <a href="#" style="display:none;" onclick="return QEditor.action(this,\'insertorderedlist\');"><img src="/images/qeditor/ol.gif" title="有序列表" alt="有序列表" /></a> \
  <a href="#" style="display:none;" class="qeditor_glast" onclick="return QEditor.action(this,\'insertunorderedlist\');"><img src="/images/qeditor/ul.gif" title="无序列表" alt="无序列表" /></a> \
  <a href="#" class="qeditor_glast" onclick="return QEditor.action(this,\'insertimage\',prompt(\'图片URL\'));"><img src="/images/qeditor/image.gif" title="插入图片" alt="插入图片" /></a> \
</div>';

var QEditor = {
	action: function(e, a, p) {
	    qeditor_preview = $(".qeditor_preview",$(e).parent().parent());
	    qeditor_preview.focus();
	    if(a == 'insertimage' && !p) {
	    	return false;
	    }
		if (p == null) {
			p = false;
		}
	    if(a == "insertcode"){
	      alert("TODO: inser [code][/code]");
	    }
	    else {
	  		document.execCommand(a, false, p);
	    }
	    if(qeditor_preview != undefined){
	      qeditor_preview.change();
	    }
	
	    return false;
	},

	renderToolbar : function(el) {
		el.parent().prepend(QEDITOR_TOOLBAR_HTML);
	},

	version : function(){ return "0.1"; }
};

(function($) {
  $.fn.qeditor = function(options) {
    if (options == false) {
      return this.each(function() {
        var obj = $(this);
        obj.parent().find('.qeditor_toolbar').detach();
        obj.parent().find('.qeditor_preview').detach();
        obj.unwrap();
      });
    }
    else {
      return this.each(function() {
        var obj = $(this);
        obj.addClass("qeditor");
				if (options && options["is_mobile_device"]) {
					var hidden_flag = $('<input type="hidden" name="did_editor_content_formatted" value="no">');
					obj.after(hidden_flag);
				} else {
					var preview_editor = $('<div class="qeditor_preview" contentEditable="true"></div>');
	        preview_editor.html(obj.val());
	        obj.after(preview_editor);
	        preview_editor.change(function(){
	          pobj = $(this);
	          t = pobj.parent().find('.qeditor');
	          t.val(pobj.html());
	        });
	        preview_editor.keyup(function(){ $(this).change(); });
	        obj.hide();
	        obj.wrap('<div class="qeditor_border"></div>');
	        obj.after(preview_editor);
	        QEditor.renderToolbar(preview_editor);
				}
      });
    }
  };
})(jQuery);

