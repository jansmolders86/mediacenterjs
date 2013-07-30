var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var settingsSchema = new Schema({
    moviepath: 			{type: String},
    musicpath: 			{type: String},
    tvpath: 			{type: String},
    language: 			{type: String},
    onscreenkeyboard: 	{type: String},
    location: 			{type: String},
    screensaver: 		{type: String},
    theme: 				{type: String},
    port: 				{type: Number},
    spotifyUser: 		{type: String},
    spotifyPass: 		{type: String},
});

module.exports = settingsSchema;