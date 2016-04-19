var socket = require('socket.io-client')('http://10.0.1.21:7000', {
	reconnection: true,
	reconnectionDelay: 200,
	reconnectionDelayMax: 200
});
socket.on('connect', function(){
	console.log('conectado');
});


socket.on('reset', function(data){
	console.log('reset', data);
});


socket.on('pinza', function(data){
	console.log('pinza', data);
});

socket.on('motor', function(data){
	console.log('motor', data);
});

socket.on('vertical', function(data){
	console.log('motor vertical', data);
});

socket.on('horizontal', function(data){
	console.log('motor horizontal', data);
});

socket.on('tv:ping', function(data){
	socket.emit('tv:pong', {data:true});
	console.log('ping...pong');
});

socket.on('disconnect', function(){});