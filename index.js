var socket = require('socket.io-client')('http://10.0.1.21:7000');
socket.on('connect', function(){
	console.log('conectado');
});
socket.on('event', function(data){
	console.log('event', data);
});

socket.on('tv:ping', function(data){
	socket.emit('tv:pong', {data:true});
	console.log('ping...pong');
});

socket.on('disconnect', function(){});