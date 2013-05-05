var http = require("http");
var GoogleMusic = require('googlemusicapi').GoogleMusicApi;
http.createServer(onRequest).listen(8888);
function onRequest(request, response) {
	var googlemusic = new GoogleMusic('user@gmail.com', 'password');
	googlemusic.Login(function () {
		googlemusic.GetAllSongs('', function(result) {
			var length = result.length;
			var i;
			for (i=0;i<length; i++) {
				console.log(result[i].title);
			}
		}); 
	});
}