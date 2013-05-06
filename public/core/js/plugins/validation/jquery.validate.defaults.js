$.validator.setDefaults({
	errorElement: "em", // the error element type
	errorPlacement: function(error, element) {
		error
			// put the error in the closest div (overrides the standard behaviour: beside the label)
			.appendTo(element.closest('div[class="row"]'))
	},
	unhighlight: function(element, errorClass, validClass) {
		// when a field is valid we remove the error class and add a valid class
		$(element).removeClass(errorClass).addClass(validClass);
	}
});
