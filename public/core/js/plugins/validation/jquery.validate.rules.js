"use strict";
$(function () {
	
var rules = [];
    rules["language"] = function(value, element) {
        var isValid = value.match(/([nl]|[en]|[fr]|[da])/)
        return isValid;
	};
    rules["path"] = function(value, element) {
		if ( element.value.match(/(\{|\}|\=|\&|\#|\%|\^|\@|\*)/)  ) { 
			return false; 
		} else if ( element.value === "" ) { 
			return true;
		} else if ( element.value.match(/\/$/) ){ 
			return true; 
		} else {
            return true; 
		}
	};
	for (var key in rules) {
		$.validator.addMethod(key, rules[key]);
	}
});
