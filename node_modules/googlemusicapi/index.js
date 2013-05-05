exports.GoogleMusicApi = GoogleMusicApi;

var GoogleClientLogin = require('googleclientlogin').GoogleClientLogin;
var restler = require('restler');

function GoogleMusic(email, password) {
	this.googleAuth = new GoogleClientLogin({
	  email: email,
	  password: password,
	  service: 'sj',
	  accountType: GoogleClientLogin.accountTypes.google
	});
}

GoogleMusic.prototype = {
	Login: function(onSuccess, onFailure, onCaptchaRequest) {
		var self = this;
		self.googleAuth.on(GoogleClientLogin.events.login, function(){
			self._getCookies(onSuccess);
		});
		self.googleAuth.on(GoogleClientLogin.events.error, function(e) {
			switch(e.message) {
				case GoogleClientLogin.errors.loginFailed:
					if (this.isCaptchaRequired()) {
						onCaptchaRequest(this.getCaptchaUrl(), this.getCaptchaToken());
					} else {
						if (typeof onFailure !== "undefined") {
							onFailure();
						}
						self.Login(onSuccess, onFailure, onCaptchaRequest);
					}
					break;
				case GoogleClientLogin.errors.tokenMissing:
				case GoogleClientLogin.errors.captchaMissing:
					throw new Error('You must pass the both captcha token and the captcha')
					break;
			}
			throw new Error('Unknown error');
		});
		self.googleAuth.login();
	},

	// get basic inforamtion( total tracks, total albums, personolized ads :) )
	GetStatus: function(callback) {
		return this._sendRequest('post','https://play.google.com/music/services/getstatus', option, null, callback);
	},

	// get all songs for Google Play, google play could respond with chunks, to receive with chunks get songs with continuationToken
    GetAllSongs: function(continuationToken, callback) {
		var option = {};
		option.continuationToken = continuationToken;
		return this._sendRequest('post','https://play.google.com/music/services/loadalltracks', option, null, callback);
	},
	
	GetPlaylist: function(playlistId, callback) {
		var option = {};
		if (playlistId != "All") {
			option = { id : playlistId };
		}
		return this._sendRequest('post','https://play.google.com/music/services/loadplaylist', option, null, callback);
	},
	
	GetSongURL: function(songId, callback) {
		return this._sendRequest('post','https://play.google.com/music/play?u=0&songid=' + songId + '&pt=e', null, null, callback);
	},
	
	DeletePlaylist: function(playlistId, callback) {
		var oprion = {};
		option = { id : playlistId };
		return this._sendRequest('post','https://play.google.com/music/services/deleteplaylist', null, null, callback);
	},

	GetNewAndRecent: function(callback) {
		return this._sendRequest('post','https://play.google.com/music/services/newandrecent', null, null, callback);
	},

	GetMixEntries: function(callback) {
		return this._sendRequest('post','https://play.google.com/music/services/getmixentries', null, null, callback);
	}, 
	
	_getCookies: function(callback) {
		var self = this;
		self._sendRequest('get','https://play.google.com/music/listen?u=0', null, null, function(result, response) {
			self.cookies = {};
			response.headers['set-cookie'] && response.headers['set-cookie'].forEach(function(cookie) {
				var parts = cookie.split('=');
				self.cookies[parts[0].trim()] = (parts[1]||'').trim();
			});
			callback();
		});
	},

	_sendRequest: function(type, url, option, body, callback) {
		var self = this;
		if((callback === null || callback === undefined) && body !== null) {
			callback = body;
			body = null;
		}

		if((callback === null || callback === undefined) && option !== null) {
			callback = option;
			option = null;
		}

		if(body && typeof body == 'object'){
			body = JSON.stringify(body)
		}
		  
		if (self.googleAuth.getAuthId() === undefined)
		{
			throw 'Try to login first';
		}
		  
		callback = callback || function(){};
		option = option || {};
		  
		var restRequest = null;
		var requestOption = { query : option, parser : restler.parsers.json };
		requestOption.headers = {};
		requestOption.headers['Authorization'] = 'GoogleLogin auth=' + self.googleAuth.getAuthId();
		if (body) {
			requestOption.data = body;
			requestOption.headers['content-type'] = 'application/json';
		}
		  
		switch(type.toLowerCase()){			
			case 'post': restRequest = restler.post(url + '?u=0&xt=' + this.cookies['xt'], requestOption);
			  break;
			default : restRequest = restler.get(url, requestOption);
		}
		  

		restRequest.on('complete', function(result, response ) {
			if(result instanceof Error || response.statusCode != 200){
				callback(result, response);
			}
			return callback(result, response);
		});
	}
}
