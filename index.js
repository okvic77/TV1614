/*
var v4l2camera = require("v4l2camera");
var cam = new v4l2camera.Camera("/dev/video0");

console.log(cam.configGet());
*/
var cv = require('opencv'),
    async = require('async'),
    _in = false;


var start = () =>_in = true,
    stop = () => _in = false


try {
    var camera = new cv.VideoCapture(0);
    camera.setWidth(320);
    camera.setHeight(240);
    async.forever(
        function(next) {

            if (_in) {
                camera.read((err, im) => {
                    if (err) return next(err);
                    var _done = false,
                        _ti = setTimeout(function() {
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
            } else {
                setTimeout(next, 200);
            }
        },
        function(err) {
            console.error('error en camara', err);
        }
    );
} catch (e) {
    console.log('sin cammara', e)
}

/*
camera.setWidth(640);
camera.setHeight(480);
*/



var rpio = require('rpio');

const map = (x, in_min, in_max, out_min, out_max) => (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
var socket = require('socket.io-client')('http://10.0.1.21:7000/pi', {
    reconnection: true,
    reconnectionDelay: 200,
    reconnectionDelayMax: 200,
    timeout: 500
});





socket.on('connect', function() {
    console.log('conectado');
    start();
});

socket.on('pinza', function(data) {
    console.log('pinza', data);
});


rpio.init({
    gpiomem: false,
    mapping: 'physical'
});


const config = {
	uno: {
		PWM: 12,
		dir: [16, 18]
	},
	dos: {
		PWM: 33,
		dir: [35, 37]
	}
};

rpio.open(config.uno.PWM, rpio.PWM);
rpio.open(config.dos.PWM, rpio.PWM);

rpio.open(config.uno.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.uno.dir[1], rpio.OUTPUT, rpio.HIGH);
rpio.open(config.dos.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.dos.dir[1], rpio.OUTPUT, rpio.HIGH);

rpio.pwmSetClockDivider(Math.pow(2, 5));


rpio.pwmSetRange(config.uno.PWM, 1024);
rpio.pwmSetRange(config.dos.PWM, 1024);
socket.on('motor', function(data) {

    if (data == 'reset') {
        rpio.pwmSetData(config.uno.PWM, 0);
        rpio.pwmSetData(config.dos.PWM, 0);
        
/*
	        rpio.write(config.uno.dir[0], rpio.LOW);
	        rpio.write(config.uno.dir[1], rpio.LOW);
	        rpio.write(config.dos.dir[0], rpio.LOW);
	        rpio.write(config.dos.dir[1], rpio.LOW);      
*/ 

    } else if (data.eje == 'derecho') {
        var valor = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1024);
        if (data.data.y >= 0) {
	        rpio.write(config.uno.dir[0], rpio.HIGH);
	        rpio.write(config.uno.dir[1], rpio.LOW);
	        // adelante
        } else {
	        // atras
	        rpio.write(config.uno.dir[0], rpio.LOW);
	        rpio.write(config.uno.dir[1], rpio.HIGH);
        }
        rpio.pwmSetData(config.uno.PWM, valor);
    } else if (data.eje == 'izquierdo') {
        var valor = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1024);
        if (data.data.y >= 0) {
	        rpio.write(config.dos.dir[0], rpio.HIGH);
	        rpio.write(config.dos.dir[1], rpio.LOW);
	        // adelante
        } else {
	        // atras
	        rpio.write(config.dos.dir[0], rpio.LOW);
	        rpio.write(config.dos.dir[1], rpio.HIGH);
        }
        rpio.pwmSetData(config.dos.PWM, valor);
    }

});

socket.on('vertical', function(data) {
    //rpio.write(12, rpio.HIGH);
    console.log('vertical', data);
});

socket.on('horizontal', function(data) {
    //rpio.write(12, rpio.LOW);
    console.log('horizontal', data);
});

socket.on('tv:ping', function(data) {
    socket.emit('tv:pong');
});

socket.on('disconnect', function() {
    stop();
});