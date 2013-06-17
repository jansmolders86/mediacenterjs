// Allowed API actions

/* API call item format
 	'api_name' : [ // list of methods in this 
  	{ 
 			method: 'method_name', 
 			type: 'GET', 
 			parameters: [{ 
 				name: 'parameter name', 
 				optional: true 
 			}]
 		}
	]

	NOTE:
	Username and password are included to 
	arguments automatically when message type is POST
 */


var arg = function(name, optional) {
	if (!optional) optional = false;
	return {name: name, optional: optional};
}

var action_params = [arg('actions', true), arg('start_ts', true),	arg('end_ts', true)]
var type_actions = [arg('types', true)].concat(action_params)
var date_actions = [arg('date', true), arg('days', true)]
var query_actions = [arg('query')]
var episode_actions = [arg('tvdb_id'), arg('imdb_id', true), arg('title'), arg('year'), arg('season'), arg('episode')]
var episode_short_actions = [arg('title'), arg('season'), arg('episode')]
var season_actions = [arg('title'), arg('season')]
var movie_actions = [arg('imdb_id'), arg('tmdb_id', true), arg('title'), arg('year')]
var show_actions = [arg('tvdb_id'), arg('imdb_id', true), arg('title'), arg('year')]
var recommendations = [arg('genre', true), arg('start_year', true), arg('end_year', true), arg('hide_collected', true), arg('hide_watchlisted', true)] 

// TODO:
// * Add missing parameters
// * Add missing dev parameters
// * Handle show title as it can be many things
// * Check parameter if it needs authentication (needed only for GET)
// * Allow objects and lists as parameters
// * Check parameter value validity
// * Check for supplementary parameters (how?)
// * Check for optional parameters that are marked as mandatory in the api

module.exports = {
	'account' : [
		{ method: 'create', type: 'POST', parameters: [arg('email')] }, // DEV
		{ method: 'settings', type: 'POST', parameters: [] },
		{ method: 'test', type: 'POST', parameters: [] }
	],
	'activity' : [
		{ method: 'community', type: 'GET', parameters: type_actions },
		{ method: 'episodes', type: 'GET', parameters: [arg('title'), arg('season'), arg('episode')].concat(action_params) },
		{ method: 'friends', type: 'POST', parameters: type_actions },
		{ method: 'movies', type: 'GET', parameters: [arg('title')].concat(action_params) },
		{ method: 'seasons', type: 'GET', parameters: [arg('title'), arg('season')].concat(action_params) },
		{ method: 'shows', type: 'GET', parameters: [arg('title')].concat(action_params) },
		{ method: 'user', type: 'GET', parameters: [arg('username')].concat(type_actions) }
	],
	'calendar' : [
		{ method: 'premieres', type: 'GET', parameters: date_actions },
		{ method: 'shows', type: 'GET', parameters: date_actions }
	],
	'friends' : [
		{ method: 'add', type: 'POST', parameters: [arg('friend')] },
		{ method: 'all', type: 'POST', parameters: [] },
		{ method: 'approve', type: 'POST', parameters: [arg('friend')] },
		{ method: 'delete', type: 'POST', parameters: [arg('friend')] },
		{ method: 'deny', type: 'POST', parameters: [arg('friend')] },
		{ method: 'requests', type: 'POST', parameters: [] }
	],
	'genres' : [
		{ method: 'movies', type: 'GET', parameters: [] },
		{ method: 'shows', type: 'GET', parameters: [] }
	],
	'lists' : [
		{ method: 'add', type: 'POST', parameters: [arg('name'), arg('privacy'), arg('description', true), arg('show_numbers', true), arg('allow_shouts')] },
		{ method: 'delete', type: 'POST', parameters: [arg('slug')] },
		{ method: 'items/add', type: 'POST', parameters: [arg('slug'), arg('items')] },
		{ method: 'items/delete', type: 'POST', parameters: [arg('slug'), arg('items')] },
		{ method: 'update', type: 'POST', parameters: [arg('slug'), arg('name', true), arg('description', true), arg('privacy', true), arg('show_numbers', true), arg('allow_shouts', true)] }
	],
	'movie' : [
		{ method: 'cancelcheckin', type: 'POST', parameters: [] }, // DEV
		{ method: 'cancelwatching', type: 'POST', parameters: [] }, // DEV
		{ method: 'checkin', type: 'POST', parameters: [] }, // DEV
		{ method: 'scrobble', type: 'POST', parameters: [] }, // DEV
		{ method: 'seen', type: 'POST', parameters: [arg('movies')] },
		{ method: 'library', type: 'POST', parameters: [arg('movies')] },
		{ method: 'related', type: 'GET', parameters: [arg('title'), arg('hidewatched')] },
		{ method: 'shouts', type: 'GET', parameters: [arg('title')] },
		{ method: 'summary', type: 'GET', parameters: [arg('title')] },
		{ method: 'unlibrary', type: 'POST', parameters: [arg('movies')] },
		{ method: 'unseen', type: 'POST', parameters: [arg('movies')] },
		{ method: 'unwatchlist', type: 'POST', parameters: [arg('movies')] },
		{ method: 'watching', type: 'POST', parameters: [arg('title')] }, // DEV
		{ method: 'watchingnow', type: 'GET', parameters: [] },
		{ method: 'watchlist', type: 'POST', parameters: [arg('movies')] }
	],
	'movies' : [
		{ method: 'trending', type: 'GET', parameters: [] },
		{ method: 'updated', type: 'GET', parameters: [arg('timestamp')] }
	],
	'rate' : [
		{ method: 'episode', type: 'POST', parameters: episode_actions.concat([arg('rating')]) },
		{ method: 'episodes', type: 'POST', parameters: [arg('episodes')] }, // TODO: add list of episodes
		{ method: 'movie', type: 'POST', parameters: movie_actions.concat([arg('rating')]) },
		{ method: 'movies', type: 'POST', parameters: [arg('movies')] }, // TODO: add list of movies
		{ method: 'show', type: 'POST', parameters: show_actions.concat([arg('rating')]) },
		{ method: 'shows', type: 'POST', parameters: [arg('shows')] }
	],
	'recommendations' : [
		{ method: 'movies', type: 'POST', parameters: recommendations },
		{ method: 'movies/dismiss', type: 'POST', parameters: movie_actions },
		{ method: 'shows', type: 'POST', parameters: recommendations },
		{ method: 'shows/dismiss', type: 'POST', parameters: [arg('tvdb_id'), arg('title', true), arg('year', true)] } // TODO: check method validity
	],
	'search' : [
		{ method: 'episodes', type: 'GET', parameters: query_actions },
		{ method: 'movies', type: 'GET', parameters: query_actions },
		{ method: 'people', type: 'GET', parameters: query_actions },
		{ method: 'shows', type: 'GET', parameters: query_actions },
		{ method: 'users', type: 'GET', parameters: query_actions }
	],
	'server' : [
		{ method: 'time', type: 'GET', parameters: [] }
	],
	'shout' : [
		{ method: 'episode', type: 'POST', parameters: episode_actions.concat([arg('shout'), arg('spoiler', true)]) },
		{ method: 'movie', type: 'POST', parameters: movie_actions.concat([arg('shout'), arg('spoiler', true)]) },
		{ method: 'show', type: 'POST', parameters: show_actions.concat([arg('shout'), arg('spoiler', true)]) }
	],
	'show' : [ // TODO: Specify missing parameters
		{ method: 'cancelcheckin', type: 'POST', parameters: [] }, // DEV
		{ method: 'cancelwatching', type: 'POST', parameters: [] }, // DEV
		{ method: 'checkin', type: 'POST', parameters: [] }, // DEV
		{ method: 'episode/library', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'episode/seen', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'episode/shouts', type: 'GET', parameters: episode_short_actions },
		{ method: 'episode/summary', type: 'GET', parameters: episode_short_actions },
		{ method: 'episode/unlibrary', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'episode/unseen', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'episode/unwatchlist', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'episode/watchingnow', type: 'GET', parameters: episode_short_actions },
		{ method: 'episode/watchlist', type: 'POST', parameters: show_actions.concat([arg('episodes')]) },
		{ method: 'library', type: 'POST', parameters: show_actions },
		{ method: 'related', type: 'GET', parameters: [arg('title'), arg('hidewatched', true)] },
		{ method: 'scrobble', type: 'POST', parameters: [] }, // DEV
		{ method: 'season', type: 'GET', parameters: season_actions },
		{ method: 'season/library', type: 'POST', parameters: show_actions.concat([arg('season')]) },
		{ method: 'season/seen', type: 'POST', parameters: show_actions.concat([arg('season')]) },
		{ method: 'seasons', type: 'GET', parameters: [arg('title')] },
		{ method: 'seen', type: 'POST', parameters: show_actions },
		{ method: 'shouts', type: 'GET', parameters: [arg('title')] },
		{ method: 'summary', type: 'GET', parameters: [arg('title'), arg('extended', true)] },
		{ method: 'unlibrary', type: 'POST', parameters: show_actions },
		{ method: 'unwatchlist', type: 'POST', parameters: [arg('shows')] },
		{ method: 'watching', type: 'POST', parameters: [] }, // DEV
		{ method: 'watchingnow', type: 'GET', parameters: [arg('title')] },
		{ method: 'watchlist', type: 'POST', parameters: [arg('shows')] }
	],
	'shows' : [
		{ method: 'trending', type: 'GET', parameters: [] },
		{ method: 'updated', type: 'GET', parameters: [arg('timestamp')] }
	],
	'user' : [ 
		{ method: 'calendar/shows', type: 'GET', parameters: [arg('username')].concat(date_actions) },
		{ method: 'friends', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'lastactivity', type: 'GET', parameters: [arg('username')] },
		{ method: 'library/movies/all', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'library/movies/collection', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'library/movies/watched', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'library/shows/all', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'library/shows/collection', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'library/shows/watched', type: 'GET', parameters: [arg('username'), arg('extended', true)] },
		{ method: 'list', type: 'GET', parameters: [arg('username'), arg('slug')] },
		{ method: 'lists', type: 'GET', parameters: [arg('username')] },
		{ method: 'profile', type: 'GET', parameters: [arg('username')] },
		{ method: 'progress/collection', type: 'GET', parameters: [arg('username'), arg('title'), arg('sort', true), arg('extended', true)] },
		{ method: 'progress/watched', type: 'GET', parameters: [arg('username'), arg('title'), arg('sort', true), arg('extended', true)] },
		{ method: 'ratings/episodes', type: 'GET', parameters: [arg('username'), arg('rating', true), arg('extended', true)] },
		{ method: 'ratings/movies', type: 'GET', parameters: [arg('username'), arg('rating', true), arg('extended', true)] },
		{ method: 'ratings/shows', type: 'GET', parameters: [arg('username'), arg('rating', true), arg('extended', true)] },
		{ method: 'watching', type: 'GET', parameters: [arg('username')] },
		{ method: 'watchlist/episodes', type: 'GET', parameters: [arg('username')] },
		{ method: 'watchlist/movies', type: 'GET', parameters: [arg('username')] },
		{ method: 'watchlist/shows', type: 'GET', parameters: [arg('username')] }
	]
}
