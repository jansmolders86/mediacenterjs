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


exports.Album = Album = schema.define('Album', {
	title 			: {type: String, index: true},
	posterURL		: String,
	year			: Number
});

exports.Artist = Artist = schema.define('Artist', {
	name 			: {type: String, index: true}
});
exports.Track = Track = schema.define('Track', {
	title			: String,
	order			: Number,
	filePath		: String
});

Artist.hasMany(Album);
Album.hasMany(Track);
Album.belongsTo(Artist);

// Album.prototype.fill = function(callback) {
	//toobject / tojson
// 	var toFill = ["artist", "tracks"];
// 	var filled = 0;
// 	for (var i = 0; i < toFill.length; i++) {
// 		this[toFill[i]](function(err, results) {
// 		    if (!err) {
// 		        this[toFill[i]] = results;
// 		        filled++;
// 		        if (filled == toFill.length) {
// 		            callback(this);
// 		        }
// 		    }
// 		});
// 	}
// }

schema.autoupdate();