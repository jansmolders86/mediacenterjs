	window.scrollTo(0,0) 
	
	// TODO: Make ip and port dynamic
	var socket = io.connect('http://192.168.0.11:3001');
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