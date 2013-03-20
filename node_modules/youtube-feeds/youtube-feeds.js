/*
Name:         youtube-feeds
Description:  Node.js module to access public YouTube data feeds.
Source:       https://github.com/fvdm/nodejs-youtube
Feedback:     https://github.com/fvdm/nodejs-youtube/issues
License:      Unlicense / Public Domain

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>
*/

var https = require('https'),
    xml2json = require('node-xml2json'),
    querystring = require('querystring')

var app = {}


///////////
// FEEDS //
///////////

app.feeds = {
	
	// Videos
	videos: function( vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/videos', vars, cb )
	},
	
	// Related videos
	related: function( videoid, vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/videos/'+ videoid +'/related', vars, cb )
	},
	
	// Responses
	responses: function( videoid, vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/videos/'+ videoid +'/responses', vars, cb )
	},
	
	// Comments
	comments: function( videoid, vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/videos/'+ videoid +'/comments', vars, cb, 'feed' )
	},
	
	// Standard feed
	// https://developers.google.com/youtube/2.0/reference#Standard_feeds
	// feeds.standard( 'most_recent', console.log )
	// feeds.standard( 'NL/top_rated_News', {time: 'today'}, console.log )
	standard: function( feed, vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/standardfeeds/'+ feed, vars, cb )
	},
	
	// Playlist
	playlist: function( playlistid, vars, cb ) {
		if( !cb && typeof vars == 'function' ) {
			var cb = vars
			var vars = {}
		}
		app.talk( 'feeds/api/playlists/'+ playlistid, vars, cb )
	}
	
}


///////////
// VIDEO //
///////////

app.video = function( videoid, cb ) {
	
	if( typeof cb == 'function' ) {
		app.talk( 'feeds/api/videos/'+ videoid, cb )
	}
	
	// video shortcuts
	return {
		
		details: function( cb ) {
			app.video( videoid, cb )
		},
		
		related: function( vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.feeds.related( videoid, vars, cb )
		},
		
		responses: function( vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.feeds.responses( videoid, vars, cb )
		},
		
		comments: function( vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.feeds.comments( videoid, vars, cb )
		}
		
	}
	
}


//////////
// USER //
//////////
	
// User
app.user = function( userid, cb ) {
	
	if( cb && typeof cb == 'function' ) {
		app.user( userid ).profile( cb )
	}
	
	return {
		
		// Favorites
		favorites: function( vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.talk( 'feeds/api/users/'+ userid +'/favorites', vars, cb )
		},
		
		// Playlists
		playlists: function( vars, cb ) {
			if( !cb && typeof vars == 'function' ) {
				var cb = vars
				var vars = {}
			}
			app.talk( 'feeds/api/users/'+ userid +'/playlists', vars, cb )
		},
		
		// Profile
		profile: function( cb ) {
			app.talk( 'feeds/api/users/'+ userid, {}, cb, 'entry' )
		}
		
	}
	
}


/////////////////
// COMMUNICATE //
/////////////////

// close connection when not done within N milliseconds
app.timeout = 30000

app.talk = function( path, fields, cb, oldJsonKey ) {
	
	// fix callback
	if( !cb && typeof fields == 'function' ) {
		var cb = fields
		var fields = {}
	}
	
	// fix fields
	if( !fields || typeof fields != 'object' ) {
		var fields = {}
	}
	
	// force JSON-C and version
	fields.alt = oldJsonKey !== undefined ? 'json' : 'jsonc'
	fields.v = 2
	
	// prepare
	var options = {
		hostname:	'gdata.youtube.com',
		port:		443,
		path:		'/'+ path +'?'+ querystring.stringify( fields ),
		headers: {
			'User-Agent':	'youtube-feeds.js (https://github.com/fvdm/nodejs-youtube)',
			'Accept':	'application/json'
		},
		method:		'GET'
	}
	
	// request
	var request = https.request( options, function( response ) {
		
		// response
		var data = ''
		response.on( 'data', function( chunk ) { data += chunk })
		response.on( 'end', function() {
			
			data = data.toString('utf8').trim()
			var error = null
			
			// validate
			if( data.match( /^(\{.*\}|\[.*\])$/ ) ) {
				
				// ok
				data = JSON.parse( data )
				
				if( data.data !== undefined ) {
					data = data.data
				} else if( data.error !== undefined ) {
					error = {origin: 'api', reason: 'error', details: data.error}
				} else if( oldJsonKey !== undefined ) {
					if( data[ oldJsonKey ] === undefined ) {
						error = {origin: 'api', reason: 'invalid response'}
					} else {
						data = data[ oldJsonKey ]
					}
				}
				
			} else if( data.match( /^<errors .+<\/errors>$/ ) ) {
				
				// xml error response
				data = xml2json.parser( data )
				
				// fix for JSONC compatibility
				var error = { errors: data.errors.error !== undefined ? [data.errors.error] : data.errors }
				error.errors.forEach( function( err, errk ) {
					if( err.internalreason !== undefined ) {
						error.errors[ errk ].internalReason = err.internalreason
						delete error.errors[ errk ].internalreason
					}
				})
				
				error = {origin: 'api', reason: 'error', details: error}
				
			} else {
				
				// not json
				error = {origin: 'api', reason: 'not json'}
				
			}
			
			// parse error
			if( error && error.origin == 'api' && error.reason == 'error' ) {
				if(
					error.details.code !== undefined
					&& error.details.errors[0] !== undefined
					&& error.details.errors[0].code == 'ResourceNotFoundException'
				) {
					error = {origin: 'method', reason: 'not found', details: error.details}
				} else if( error.details.code == 403 ) {
					error = {origin: 'method', reason: 'not allowed', details: error.details}
				} else if( error.details.message == 'Invalid id' ) {
					error = {origin: 'method', reason: 'invalid id'}
				}
			}
			
			// parse response
			if( data.totalItems !== undefined && data.totalItems == 0 ) {
				error = {origin: 'method', reason: 'not found'}
			} else if(
				data.feed !== undefined
				&& data.feed['openSearch$totalResults'] !== undefined
				&& data.feed['openSearch$totalResults']['$t'] !== undefined
				&& data.feed['openSearch$totalResults']['$t'] == 0
			) {
				error = {origin: 'method', reason: 'not found'}
			}
			
			// do callback
			var err = null
			if( error ) {
				err = new Error( error.reason )
				err.origin = error.origin
				err.details = error.details || null
			}
			cb( err, data )
			
		})
		
		// early disconnect
		response.on( 'close', function() {
			var err = new Error( 'connection closed' )
			err.origin = 'api'
			cb( err )
		})
		
	})
	
	// no endless waiting
	request.setTimeout( app.timeout, function() {
		request.destroy()
	})
	
	// connection error
	request.on( 'error', function( error ) {
		var err = new Error( 'connection error' )
		err.origin = 'request'
		err.details = error
		cb( err )
	})
	
	// perform and finish request
	request.end()
	
}

// ready
module.exports = app
