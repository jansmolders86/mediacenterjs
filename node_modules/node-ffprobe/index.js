var ffprobe = module.exports = require('./lib/ffprobe.js');

if(require.main === module) {
	var exit = function(code, msg) {
		process.nextTick(function() { process.exit(code) });

		if(code !== 0) console.error(msg);
		else console.log(msg);
	};

	var args = process.argv.slice(2);

	if(args.length === 0) return exit(1, "Usage: node index.js /path/to/audio/file.mp3");

	!function probeFile(file) {
		if(!file) return exit(0, 'Finished probing all files');

		ffprobe(file, function(err, results) {
			console.log('%s\n========================================\n%s\n\n', file, err || JSON.stringify(results, null, '   '));

			probeFile(args.shift());
		});
	}(args.shift());
}