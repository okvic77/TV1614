var spawn = require("child_process").spawn;

var socket = require('socket.io-client')('http://10.0.1.21:7000', {
	reconnection: true,
	reconnectionDelay: 200,
	reconnectionDelayMax: 200
});

var _in, start = function(){
	_in = setInterval(function(){
		//console.log('image');
		//socket.emit('image', {data:true});
	}, 1000)
}, stop = function(){
	clearInterval(_in);
}

socket.on('connect', function(){
	console.log('conectado');
	start();
});

socket.on('pinza', function(data){
	console.log('pinza', data);
});

socket.on('motor', function(data){
	console.log('motor', data);
});

socket.on('vertical', function(data){
	console.log('vertical', data);
});

socket.on('horizontal', function(data){
	console.log('horizontal', data);
});

socket.on('tv:ping', function(data){
	socket.emit('tv:pong');
});

socket.on('disconnect', function(){
	stop();
});