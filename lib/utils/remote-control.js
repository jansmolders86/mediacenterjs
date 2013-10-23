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
			console.log(data);
			if(socket.type === "remote"){
				if(data.action === "enter"){
					if(ss != undefined){
						ss.emit("controlling", {action:"enter"});
					}
				}
				if(data.action === "back"){
					if(ss != undefined){
						ss.emit("controlling", {action:"back"});
					}
				}
				if(data.action === "play"){
					if(ss != undefined){
						ss.emit("controlling", {action:"back"});
					}
				}		
				if(data.action === "pause"){
					if(ss != undefined){
						ss.emit("controlling", {action:"pause"});
					}
				}	
				if(data.action === "stop"){
					if(ss != undefined){
						ss.emit("controlling", {action:"stop"});
					}
				}			
				if(data.action === "fullscreen"){
					if(ss != undefined){
						ss.emit("controlling", {action:"fullscreen"});
					}
				}					
				else if(data.action === "goLeft"){
					if(ss != undefined){
						ss.emit("controlling", {action:"goLeft"});
					}
				}
				else if(data.action === "goRight"){
					if(ss != undefined){
						ss.emit("controlling", {action:"goRight"});
					}
				}
			}
		});
	});
}
