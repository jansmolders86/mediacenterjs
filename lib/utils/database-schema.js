var jugglingdb = require('jugglingdb')
  , Schema = jugglingdb.Schema;


var schema = new Schema('sqlite3', {
	database : './lib/database/mcjsjdb.sqlite'
});

exports.Movie = Movie = schema.define('Movie', {
	originalName 	: String,
	title			: String,
	posterURL		: String,
	backgroundURL	: String,
	imdbID			: String,
	rating 			: String,
	certification	: String,
	genre			: String,
	runtime			: String,
	overview		: Schema.Text,
	cdNumber		: Number,
	adult			: Boolean,
	hidden			: {type: String, default:"false"}
});


schema.autoupdate();