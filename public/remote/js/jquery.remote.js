
	$.ajax({
		url: '/configuration/', 
		type: 'get'
	}).done(function(data){
		// TODO: Make ip and port dynamic
		var socket = io.connect(data.localIP+':'+data.remotePort);
		socket.on('connect', function(data){
			socket.emit('remote');	
			
			$(".left.link").on('click',function(){
				socket.emit('control',{action:"goLeft"}); 
			});

			$(".right.link").on('click',function(){
				socket.emit('control',{action:"goRight"}); 
			});
			
			$(".enter").on('click',function(){
				socket.emit('control',{action:"enter"}); 
			});
			
			$(".back").on('click',function(){
				socket.emit('control',{action:"back"}); 
			});		

			$(".play").on('click',function(){
				socket.emit('control',{action:"play"}); 
			});	

			$(".pause").on('click',function(){
				socket.emit('control',{action:"pause"}); 
			});	

			$(".stop").on('click',function(){
				socket.emit('control',{action:"stop"}); 
			});		

			$(".fullscreen").on('click',function(){
				socket.emit('control',{action:"fullscreen"}); 
			});			

			socket.on("loading", function(data){
				console.log(data);
			});  
		});
	});