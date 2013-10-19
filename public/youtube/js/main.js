$(function(){
	$('body').mcjs();
	// Animate the cards In
	$('.card:nth-child(even)').addClass('animated rotateInUpLeft');
	$('.card:nth-child(odd)').addClass('animated rotateInUpRight');
	if($('h1#error').text().length > 0) {
		countdownError();
	}
	searchBar();
	cardClickListener();
});

/**
 * Countdown till OAuth popover displays
 */
function countdownError() {
	var countdown = 3;
	var interval = setInterval(function () {
		if(countdown === 0) {
			clearInterval(interval);
			OAuth.initialize(localStorage.getItem('oauth_key'));
			OAuth.popup('youtube', function (error, oauthData){
				if(error) {
					updateError(error);
					return;
				}
				localStorage.setItem('oauth_token', oauthData.access_token);
				updateRemoteToken();
			});
		}
		$('h1#error span').text(countdown--);
	}, 1000);
}

/**
 * Send ajax request with oauth token
 */
function updateRemoteToken() {
	$.ajax({
		type: 'POST',
		url: '/youtube/updateToken',
		data: 'oauth='+localStorage.getItem('oauth_token'),
		success: function() {
			updateError('Refreshing...');
			setTimeout(function () {
				location.reload();
			},2000);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			if(error instanceof Error) {
				updateError(jqXHR.responseText);
			}
			else {
				$('h1').text('Need to re-authenticate to Google, popup in ');
				countdownError();
			}
		}
	});
}

/**
 * Updates markup with new error messages
 * @param  {string} message The error message
 */
function updateError(message) {
	$('h1#error').fadeOut('fast', function () {
		$(this).text(message);
		$(this).fadeIn('fast');
	});
}

/**
 * Sends request to server to search youtube for given query
 * @param  {String}   query    Query to search
 * @param  {Function} callback The callback function to send back
 * @return {Function} callback ^
 */
function searchYoutube(query, callback) {
	$.ajax({
    	type: 'POST',
    	url: '/youtube/searchYoutube',
    	data: 'q=' + query,
    	success: function(data) {
    		return callback(null, data);
    	},
    	error: function (jqXHR, textStatus, errorThrown) {
    		return callback(JSON.parse(jqXHR.responseText));
    	}
    });
}

/**
 * Updates the cards on the DOM with the new data
 * @param  {Array} data The array of new data for the cards
 */
function updateCards(data) {
	$('.card:nth-child(even)').removeClass('animated rotateInUpLeft');
	$('.card:nth-child(odd)').removeClass('animated rotateInUpRight');
	$('.card:nth-child(odd)').addClass('animated rotateOutUpLeft');
	$('.card:nth-child(even)').addClass('animated rotateOutUpRight');
	setTimeout(function () {
		var oldCardAmount = $('.card').size();
		var newCardAmount = data.length;
		if(newCardAmount > oldCardAmount || newCardAmount < oldCardAmount) {
			// Make new cards
			getCards(newCardAmount, function (error, cardHTML) {
				if(error) {
					console.log('Error updating cards: ', error);
					// TODO If error, tell user we couldn't complete the update
					return;
				}
				$('main').html(cardHTML);
				populateCards(data);
			});
		} else {
			populateCards(data);
		}
	}, 500);
}

/*http://stackoverflow.com/a/8363049/1612721*/
function createDateString(createdDate) {
	return createdDate.getUTCFullYear() +"/"+
	("0" + (createdDate.getUTCMonth()+1)).slice(-2) +"/"+
	("0" + createdDate.getUTCDate()).slice(-2) + " " +
	("0" + createdDate.getUTCHours()).slice(-2) + ":" +
	("0" + createdDate.getUTCMinutes()).slice(-2) + ":" +
	("0" + createdDate.getUTCSeconds()).slice(-2) + " UTC";
}
/**
 * Gets raw HTML of empty cards to fill in
 * @param  {int}   cardAmount The amount of cards we want
 * @param  {Function} callback   The callback to send back
 * @return {Function} callback   ^
 */
function getCards(cardAmount, callback) {
	$.ajax({
		type: "POST",
		url: "/youtube/getCards",
		data: "cardAmount="+cardAmount,
		success: function (data) {
			return callback(null, data.data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			return callback(jqXHR.responseText);
		}
	});
}

/**
 * Populates the cards with the data
 * @param  {Array} data The array of new data for the cards
 */
function populateCards(data) {
	$('.card').each(function (index, element) {
		var createdDate = new Date(data[index].snippet.publishedAt);
		var dateString = createDateString(createdDate);
		$(this).children('.map').children('#duration').text(getDuration(data[index].contentDetails.duration));
		$(this).data('id', data[index].id);
		$(this).children('.map').css('background-image', 'url('+data[index].snippet.thumbnails.high.url+')');
		$(this).children('h2').children('strong').text(data[index].snippet.title);
		$(this).children('h3').eq(0).text(data[index].snippet.channelTitle + ' - ' + data[index].statistics.viewCount + ' views');
		$(this).children('h3').eq(1).text('Created on: ' + dateString);
	});
	$('.card:nth-child(even)').removeClass('animated rotateOutUpRight');
	$('.card:nth-child(odd)').removeClass('animated rotateOutUpLeft');
	$('.card:nth-child(odd)').addClass('animated rotateInUpLeft');
	$('.card:nth-child(even)').addClass('animated rotateInUpRight');
}

// Logic for searchbar
function searchBar() {
	// When enter is pressed in the searchbar
	$('input#search').keyup(function(event){
    	if($(this).val().length > 0 && event.keyCode === 13){
    		// Show the Searching... label
    		$('label[for="search"]').fadeIn('fast', function () {
    			$(this).text('Searching');
    			var timeout = setInterval(function (){
    				var searchText = $('label[for="search"]').text();
    				$('label[for="search"]').text(searchText + '.');
    				if(searchText.indexOf('..') !== -1) {
    					clearTimeout(timeout);
    				}
    			}, 1000);
    		});
    		// Search youtube for query
    		searchYoutube($('input#search').val(), function (error, data) {
    			if(error) {
    				$('label[for="search"]').text(JSON.parse(error.message));
    				return;
    			}
    			$('label[for="search"]').fadeOut('fast');
    			// Use search results to repopulate the cards
    			updateCards(data);
    		});
    	}
    });
}

function cardClickListener() {
	$('.card').each(function () {
		$(this).click(function () {
			$(this).removeClass('animated rotateInUpLeft rotateInUpRight rotateOutUpLeft rotateOutUpRight');
		});
	});
	$('body').delegate('.card','click', function(){
		if($('.card.active').length <= 0) {
			$(this).addClass('cloned');
			var parent = $(this).parent().parent();
			var position = $(this).position();
			var clone = $(this).clone().addClass('active');
			parent.append(clone);
			clone.css({
				left: position.left + 'px',
				top: position.top + 'px'
			}).animate({
				width: '100%',
				height: '100%',
				top: 0,
				left: 0
			}, 500);
		}
	});
	$('body').delegate('.card.active', 'click', function() {
		var cloned = $('.card.cloned');
		var position = cloned.position();
		var w = cloned.width();
		var h = cloned.height();
		$(this).animate({
			width: w + 'px',
			height: h + 'px',
			top: position.top + 'px',
			left: position.left + 'px'
		}, 500, function() {
			$('.card.active').remove();
			cloned.removeClass('cloned');
		});
	});
}

// Converts ISO8601 standard time from Youtube to minutes and seconds
function getDuration(iso8601Duration) {
	var durationInSeconds = nezasa.iso8601.Period.parseToTotalSeconds(iso8601Duration);
	return Math.floor(durationInSeconds/60) + ':' + ('0' + durationInSeconds%60).slice(-2);
}