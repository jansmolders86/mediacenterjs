/*
 * Requirements: jQuery 1.7.1
 */
(function($){

	var ns = 'prettyForm'
		,methods = {

			_init: function(options) {

				var opts = $.extend({}, $.fn.prettyForm.defaults, options);

				this.each(function() {

					var $that = $(this)
						,o = $.metadata ? $.extend({}, opts, $that.metadata()) : opts
						,toggleCheckedClass = function(){
							if($that.is(':checked') === true){
								$that.closest('.pretty').addClass('checked')
							} else{
								$that.closest('.pretty').removeClass('checked')
							}
						};

					// hide the initial checkbox/radiobutton
					$that.css("opacity","0");


					// wrap a div around the checkbox/radiobutton for styling
					$that.wrap('<span class="pretty" />');

					// initialize the classes (checks if elements are already selected)
					toggleCheckedClass();

					// we add/remove a special class to style the focus style
					$that
					  .on('focus', function(){
						$(this).closest('.pretty').toggleClass('has-focus');
					}).on('blur', function(){
						$(this).closest('.pretty').toggleClass('has-focus');
					});

					// add class to checkbox pretty div, for styling
					if($that.is(':checkbox')){
						$that.closest('.pretty').addClass('type-checkbox');
					}

					// add class to radio pretty div, for styling
					if($that.is(':radio')){
						$that.closest('.pretty').addClass('type-radio');
					}

					$that.change( function(){
						if($that.is(':radio')){
							 var radioName = $that.attr('name');
							 $('input[type=radio][name=' + radioName + ']')
							 	.closest('.pretty')
							 	.removeClass('checked');
						}
						toggleCheckedClass();
					});

				});
			}
		};

	$.fn.prettyForm = function( method ) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods._init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.fn.prettyForm' );
		}
	};

	$.fn.prettyForm.defaults = {
	};

})(jQuery);