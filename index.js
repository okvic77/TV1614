/*
var v4l2camera = require("v4l2camera");
var cam = new v4l2camera.Camera("/dev/video0");

console.log(cam.configGet());
*/
var cv = require('opencv'), async = require('async');

var camera = new cv.VideoCapture(0);
camera.setWidth(640);
camera.setHeight(480);
var rpio = require('rpio');

const map = (x, in_min, in_max, out_min, out_max) => (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
var socket = require('socket.io-client')('http://10.0.1.21:7000/pi', {
	reconnection: true,
	reconnectionDelay: 200,
	reconnectionDelayMax: 200,
	timeout: 500
});


var _in = false;
async.forever(
    function(next) {
	    
	    if (_in) {
		    console.log('enviar imagen');
		   camera.read((err, im) => {
	      if (err) return next(err);
	      
		  var _done = false, _ti = setTimeout(function(){
			  _done = true;
			  next();
		  }, 1000);

			socket.emit('image', im.toBuffer(), () => {
				if (_done == false) {
					_done = true;
					next();
					clearTimeout(_ti);
				}
				
				
			})
		}); 
	    }
      
		else {
			console.log('nada imagen');
			setTimeout(next, 200);
		}
    },
    function(err) {
	    console.error('error en camara', err);
        // if next is called with a value in its first parameter, it will appear 
        // in here as 'err', and execution will stop. 
    }
);


var start = function(){
	_in = true;
}, stop = function(){
	_in = false;
}

socket.on('connect', function(){
	console.log('conectado');
	start();
});

socket.on('pinza', function(data){
	console.log('pinza', data);
});


rpio.init({gpiomem: false, mapping: 'physical'});



const PWM1 = 12, PWM2 = 33;
rpio.open(PWM1, rpio.PWM);
rpio.open(PWM2, rpio.PWM);

//rpio.open(19, rpio.PWM);
rpio.open(35, rpio.PWM);
rpio.pwmSetClockDivider(Math.pow(2, 5));


rpio.pwmSetRange(PWM1, 1024);
socket.on('motor', function(data){
	
	if (data == 'reset') {
		rpio.pwmSetData(PWM1, 0);
		rpio.pwmSetData(PWM2, 0);
	} else if(data.eje) {
		
			var valor = map(Math.abs(data.data.x), 6000, Math.pow(2, 15), 0, 1024);
	//console.log('motor', valor, data.data.x);
		
			rpio.pwmSetData(PWM1, valor);
		} else {
			
		}
	
});

socket.on('vertical', function(data){
	//rpio.write(12, rpio.HIGH);
	console.log('vertical', data);
});

socket.on('horizontal', function(data){
	//rpio.write(12, rpio.LOW);
	console.log('horizontal', data);
});

socket.on('tv:ping', function(data){
	socket.emit('tv:pong');
});

socket.on('disconnect', function(){
	stop();
});