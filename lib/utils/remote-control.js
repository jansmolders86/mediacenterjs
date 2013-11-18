exports.remoteControl = function() {
	var ss
	, configuration_handler = require('../handlers/configuration-handler')
	, config = configuration_handler.initializeConfiguration()
	, remotePort = parseInt(config.remotePort) || 3001
	, io = require('socket.io').listen(remotePort);
	
	io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) {
		socket.on("screen", function(data){
			socket.type = "screen";
			ss = socket;
			console.log("Screen ready...");
		});
		
		socket.on("remote", function(data){
			socket.type = "remote";
			console.log("Remote ready...");
		});

		socket.on("control", function(data){
			if(socket.type === "remote"){
				console.log(data.action)
				switch(data.action) {
					case "enter" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"enter"});
						}
					break;
					case "dashboard" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"dashboard"});
						}
					break;
					case "mute" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"mute"});
						}
					break;
					case "shuffle" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"shuffle"});
						}
					break;
					case "back" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"back"});
						}
					break;
					case "pause" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"pause"});
						}
					break;
					case "fullscreen" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"fullscreen"});
						}
					break;
					case "goLeft" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"goLeft"});
						}
					break;
					case "goRight" :
						if(ss !== undefined){
							ss.emit("controlling", {action:"goRight"});
						}
					break;
				}
			}
		});
		
		socket.on("message", function(data){
			if(socket.type === "remote"){
				if(ss !== undefined){
					ss.emit("sending", data);
				}
			}	
		});
	});
}
