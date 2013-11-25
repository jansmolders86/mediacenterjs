$(function() {
    //validation init
	$('.validate-form').validate();

    // pretty form init
	$("[type=checkbox], [type=radio]").prettyForm();

    //Set theme
	$('#theme').find('option').each(function(){
		var cleanedThemeName = $(this).html().replace(/\.(css)/i,"");
		$(this).text(cleanedThemeName);
	});

    // Get key for mediacenterjs.com
	$.ajax({
		type: "GET",
		dataType: "jsonp",
		jsonpCallback : 'parseResponse',
		url: "http://www.mediacenterjs.com/global/js/getkey.js",
		success: function (data) {
			$('#oauthKey').val(data.key);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('error', errorThrown);
			// fallback to last known working key
			$('#oauthKey').val('HVpbR2kQokDRgU3z5kJhLbS7BjY');
		}
	});

    // OAUTH click
	$('a#oauth').click(function (e) {
		e.preventDefault();
		OAuth.initialize($('input#oauthKey').val());
		OAuth.popup('youtube', function (error, oauthData){
			if(error instanceof Error) {
				$('label[for="oauthKey"]').text(error.message);
			} else {
				localStorage.setItem('oauth_token', oauthData.access_token);
				localStorage.setItem('oauth_key', $('input#oauthKey').val());
				$('input.oauth').val(localStorage.getItem('oauth_token'));
				$('input.oauthKeyHidden').val(localStorage.getItem('oauth_key'));
			}
		});
	});

    // Get key from local storage
	if(localStorage.getItem('oauth_token')) {
		$('input.oauth').val(localStorage.getItem('oauth_token'));
		$('input.oauthKeyHidden').val(localStorage.getItem('oauth_key'));
	} 
});