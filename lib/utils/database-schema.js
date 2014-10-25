var Sequelize = require('sequelize')
  , sequelize = new Sequelize('mediacenterjs', "", "", {
  	dialect: "sqlite",
  	storage: "./lib/database/mcjsseq.sqlite",
  	//logging: false,
  });


var noTimeStamps = {
	timestamps: false
};

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
	year			: Sequelize.INTEGER,
	hidden			: {type: Sequelize.STRING, defaultValue:"false"}
}, noTimeStamps);


exports.Album = Album = sequelize.define('Album', {
	title 			: Sequelize.STRING,
	posterURL		: Sequelize.STRING,
	year			: Sequelize.INTEGER
}, noTimeStamps);

exports.Artist = Artist = sequelize.define('Artist', {
	name 			: Sequelize.STRING
}, noTimeStamps);
exports.Track = Track = sequelize.define('Track', {
	title			: Sequelize.STRING,
	order			: Sequelize.INTEGER,
	filePath		: Sequelize.STRING,
}, noTimeStamps);

Artist.hasMany(Album);
Album.hasMany(Track);
Album.belongsTo(Artist);

exports.Device = Device = sequelize.define('Device', {
	deviceID 		: Sequelize.STRING,
	lastSeen		: Sequelize.STRING,
	isAllowed		: Sequelize.STRING
}, noTimeStamps);


exports.Show = Show = sequelize.define('Show', {
	name			: Sequelize.STRING,
	posterURL		: Sequelize.STRING,
	genre			: Sequelize.STRING,
	certification	: Sequelize.STRING
}, noTimeStamps);

exports.Episode = Episode = sequelize.define('Episode', {
	fileName 		: Sequelize.STRING,
	name 			: Sequelize.STRING,
	season			: Sequelize.INTEGER,
	episode 		: Sequelize.INTEGER
}, noTimeStamps);

Show.hasMany(Episode);
Episode.belongsTo(Show);

exports.ProgressionMarker = ProgressionMarker = sequelize.define('ProgressionMarker', {
	progression 	: Sequelize.INTEGER,
	transcodingStatus: Sequelize.STRING
}, noTimeStamps);

ProgressionMarker.belongsTo(Movie);
ProgressionMarker.belongsTo(Episode);

sequelize.sync()
.success(function () {
	 var migrator = sequelize.getMigrator({ path: process.cwd() + '/migrations'});
	 migrator.migrate()
	 .success(function () { console.log("successfully migrated");})
	 .error(function(err) { console.log("failed to migrate", err);});
});
