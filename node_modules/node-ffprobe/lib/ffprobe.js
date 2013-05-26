var spawn = require('child_process').spawn,
		fs = require('fs'),
		path = require('path');

module.exports = (function() {
	function findBlocks(raw) {
		var stream_start = raw.indexOf('[STREAM]') + 8,
				stream_end = raw.lastIndexOf('[/STREAM]'),
				format_start = raw.indexOf('[FORMAT]') + 8,
				format_end = raw.lastIndexOf('[/FORMAT]');

		var blocks = { streams: null, format: null };

		if(stream_start !== 7 && stream_end !== -1) {
			blocks.streams = raw.slice(stream_start, stream_end).trim();
		}

		if(format_start !== 7 && format_end !== -1) {
			blocks.format = raw.slice(format_start, format_end).trim();
		}

		return blocks;
	};


	function parseField(str) {
		str = ("" + str).trim();
		return str.match(/^\d+\.?\d*$/) ? parseFloat(str) : str;
	};

	function parseBlock(block) {
		var block_object = {}, lines = block.split('\n');

		lines.forEach(function(line) {
			var data = line.split('=');
			if(data && data.length === 2) {
				block_object[data[0]] = parseField(data[1]);
			}
		});

		return block_object;
	};

	function parseStreams(text, callback) {
		if(!text) return { streams: null };

		var streams = [];
		var blocks = text.replace('[STREAM]\n', '').split('[/STREAM]');

		blocks.forEach(function(stream, idx) {
			var codec_data = parseBlock(stream);
			var sindex = codec_data.index;
			delete codec_data.index;

			if(sindex) streams[sindex] = codec_data;
			else streams.push(codec_data);
		});

		return { streams: streams };
	};

	function parseFormat(text, callback) {
		if(!text) return { format: null }

		var block = text.replace('[FORMAT]\n', '').replace('[/FORMAT]', '');

		var raw_format = parseBlock(block),
				format = { },
				metadata = { };

		//REMOVE metadata
		delete raw_format.filename;
		for(var attr in raw_format) {
			if(raw_format.hasOwnProperty(attr)) {
				if(attr.indexOf('TAG') === -1) format[attr] = raw_format[attr];
				else metadata[attr.slice(4)] = raw_format[attr];
			}
		}

		return { format: format, metadata: metadata };
	};

	function doProbe(file, callback) {
		var proc = spawn('ffprobe', ['-show_streams', '-show_format', '-loglevel', 'warning', file]),
				probeData = [],
				errData = [],
				exitCode = null,
				start = Date.now();

		proc.stdout.setEncoding('utf8');
		proc.stderr.setEncoding('utf8');

		proc.stdout.on('data', function(data) { probeData.push(data) });
		proc.stderr.on('data', function(data) { errData.push(data) });

		proc.on('exit', function(code) {
			exitCode = code;
		});
		proc.on('close', function() {
			var blocks = findBlocks(probeData.join(''));

			var s = parseStreams(blocks.streams),
					f = parseFormat(blocks.format);

			if (exitCode) {
				var err_output = errData.join('');
				return callback(err_output);
			}

			callback(null, {
				filename: path.basename(file),
				filepath: path.dirname(file),
				fileext: path.extname(file),
				file: file,
				probe_time: Date.now() - start,
				streams: s.streams,
				format: f.format,
				metadata: f.metadata
			});
		});
	};

	return doProbe;
})()
