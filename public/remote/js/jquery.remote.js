	$(document).ready(function() {
		var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]; 
		var dayNames= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

		var newDate = new Date();
		newDate.setDate(newDate.getDate());  
		$('#Date').html(dayNames[newDate.getDay()] + " " + newDate.getDate() + ' ' + monthNames[newDate.getMonth()] + ' ' + newDate.getFullYear());

		setInterval( function() {
			var seconds = new Date().getSeconds();
			$("#sec").html(( seconds < 10 ? "0" : "" ) + seconds);
			
			var minutes = new Date().getMinutes();
			$("#min").html(( minutes < 10 ? "0" : "" ) + minutes);
			
			var hours = new Date().getHours();
			$("#hours").html(( hours < 10 ? "0" : "" ) + hours);
		},1000);
	});


	// TODO: Make ip and port dynamic
	var socket = io.connect('http://pc0030.isaac.local:3001');
	socket.on('connect', function(data){
		socket.emit('remote');	
		
		$(".left").on('click',function(){
			socket.emit('control',{action:"goLeft"}); 
		});

		$(".right").on('click',function(){
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