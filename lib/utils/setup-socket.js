// Setup Socket.IO 

var io = null;

module.exports = function(server) {
	io = require('socket.io').listen(server);
	console.log("socket setup");
	return module.exports;
}

module.exports.__defineGetter__('io', function() {
	if (!io) {
		throw "Tried to use sockets without setting them up with a server first";
	}
	return io;
});