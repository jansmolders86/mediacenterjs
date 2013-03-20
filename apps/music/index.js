var fs = require('fs')
//var lame = require('lame');
//var Speaker = require('speaker');
 
// Choose your render engine. The default choice is JADE:  http://jade-lang.com/
exports.engine = 'jade';

// Render the indexpage
exports.index = function(req, res, next){
	res.render('hello');
};

