var Sequelize = require('sequelize')
  , sequelize = new Sequelize('mediacenterjs', "", "", {
  	dialect: "sqlite",
  	storage: "./lib/database/mcjsseq.sqlite"
  });



exports.Movie = Movie = sequelize.define('Movie', {
	originalName 	: Sequelize.STRING,
	title			: Sequelize.STRING,
	posterURL		: Sequelize.STRING,
	backgroundURL	: Sequelize.STRING,
	imdbID			: Sequelize.STRING,
	rating 			: Sequelize.STRING,
	certification	: Sequelize.STRING,
	genre			: Sequelize.STRING,
	runtime			: Sequelize.STRING,
	overview		: Sequelize.TEXT,
	cdNumber		: Sequelize.INTEGER,
	adult			: Sequelize.BOOLEAN,
	hidden			: {type: Sequelize.STRING, defaultValue:"false"}
});


exports.Album = Album = sequelize.define('Album', {
	title 			: Sequelize.STRING,
	posterURL		: Sequelize.STRING,
	year			: Sequelize.INTEGER
});

exports.Artist = Artist = sequelize.define('Artist', {
	name 			: Sequelize.STRING
});
exports.Track = Track = sequelize.define('Track', {
	title			: Sequelize.STRING,
	order			: Sequelize.INTEGER,
	filePath		: Sequelize.STRING
});

Artist.hasMany(Album);
Album.hasMany(Track);
Album.belongsTo(Artist);

sequelize.sync();