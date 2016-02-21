var Sequelize = require('sequelize');
var sqlite = require( 'sqlite3' )
  , sequelize = new Sequelize('mediacenterjs', "", "", {
      dialect: "sqlite",
	  connection: new sqlite.Database( './lib/database/mcjsseq.sqlite' ),
      storage: "./lib/database/mcjsseq.sqlite"
      //logging: false,
  });

var logger = require('winston');
var Umzug = require('umzug');

var noTimeStamps = {
    timestamps: false
};

exports.Movie = Movie = sequelize.define('Movie', {
    filePath         : Sequelize.STRING,
    title            : Sequelize.STRING,
    posterURL        : {type: Sequelize.STRING, defaultValue: '/movies/css/img/nodata.jpg'},
    backgroundURL    : {type: Sequelize.STRING, defaultValue: '/movies/css/img/backdrop.jpg'},
    imdbID           : Sequelize.STRING,
    rating           : {type: Sequelize.STRING, defaultValue: 'Unknown'},
    certification    : Sequelize.STRING,
    genre            : {type: Sequelize.STRING, defaultValue: 'Unknown'},
    runtime          : {type: Sequelize.STRING, defaultValue: 'Unknown'},
    overview         : Sequelize.TEXT,
    cdNumber         : Sequelize.INTEGER,
    adult            : Sequelize.BOOLEAN,
    year             : Sequelize.INTEGER,
    hidden           : {type: Sequelize.STRING, defaultValue:"false"}
}, noTimeStamps);


exports.Album = Album = sequelize.define('Album', {
    title           : Sequelize.STRING,
    posterURL       : Sequelize.STRING,
    year            : Sequelize.INTEGER
}, noTimeStamps);

exports.Artist = Artist = sequelize.define('Artist', {
    name             : Sequelize.STRING
}, noTimeStamps);
exports.Track = Track = sequelize.define('Track', {
    title            : Sequelize.STRING,
    order            : Sequelize.INTEGER,
    filePath         : Sequelize.STRING,
}, noTimeStamps);

Artist.hasMany(Album);
Album.hasMany(Track);
Album.belongsTo(Artist);

exports.Device = Device = sequelize.define('Device', {
    deviceID         : Sequelize.STRING,
    lastSeen         : Sequelize.STRING,
    isAllowed        : Sequelize.STRING
}, noTimeStamps);


exports.Show = Show = sequelize.define('Show', {
    name             : Sequelize.STRING,
    posterURL        : Sequelize.STRING,
    genre            : Sequelize.STRING,
    certification    : Sequelize.STRING
}, noTimeStamps);

exports.Episode = Episode = sequelize.define('Episode', {
    filePath         : Sequelize.STRING,
    name             : Sequelize.STRING,
    season           : Sequelize.INTEGER,
    episode          : Sequelize.INTEGER
}, noTimeStamps);

Show.hasMany(Episode);
Episode.belongsTo(Show);

exports.ProgressionMarker = ProgressionMarker = sequelize.define('ProgressionMarker', {
    progression     : Sequelize.INTEGER,
    transcodingStatus: Sequelize.STRING
}, noTimeStamps);

ProgressionMarker.belongsTo(Movie);
ProgressionMarker.belongsTo(Episode);

sequelize.sync()
.then(function () {
    var umzug = new Umzug({
        migrations: {
            params: [sequelize.getQueryInterface(), Sequelize],
            path: process.cwd() + '/lib/database/migrations'
        },
        storage: "sequelize",
        storageOptions: {
            sequelize: sequelize
        },
        logging: console.log
    });

   umzug.pending().then(function (migs) {
	   //add all the migrations that haven't been done
	   //to the meta table so sequelize thinks they've been done
	   //as this is a fresh install and the schema matches the latest migration
	   //we don't want sequelize running the migrations

	   return migs.map(function (mig) {
		   return umzug.storage.logMigration(mig.file);
	   });
   });
});
