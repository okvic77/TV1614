/*
var v4l2camera = require("v4l2camera");
var cam = new v4l2camera.Camera("/dev/video0");

console.log(cam.configGet());
*/
var cv = require('opencv'),
    async = require('async'),
    _in = false;

var start = () => _in = true,
    stop = () => _in = false

try {
    var camera = new cv.VideoCapture(0);
    camera.setWidth(320);
    camera.setHeight(240);
    async.forever(function(next) {

        if (_in) {
            camera.read((err, im) => {
                if (err)
                    return next(err);
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
    }, function(err) {
        console.error('error en camara', err);
    });
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

rpio.init({gpiomem: false, mapping: 'physical'});

const config = {
    izquierdo: {
        PWM: 12,
        dir: [16, 18]
    },
    derecha: {
        PWM: 33,
        dir: [29, 31]
    },
    pinza: 35, // PWM
    acordeon: [37, 38]
};

rpio.open(config.izquierdo.PWM, rpio.PWM);
rpio.open(config.derecha.PWM, rpio.PWM);
//rpio.open(config.acordeon.PWM, rpio.PWM);

rpio.open(config.derecha.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.derecha.dir[1], rpio.OUTPUT, rpio.HIGH);
rpio.open(config.izquierdo.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.izquierdo.dir[1], rpio.OUTPUT, rpio.HIGH);

//rpio.open(config.acordeon.dir[0], rpio.OUTPUT, rpio.LOW);
//rpio.open(config.acordeon.dir[1], rpio.OUTPUT, rpio.HIGH);

rpio.pwmSetClockDivider(Math.pow(2, 5));

rpio.pwmSetRange(config.izquierdo.PWM, 1024);
rpio.pwmSetRange(config.derecha.PWM, 1024);
//rpio.pwmSetRange(config.acordeon.PWM, 1024);

socket.on('motor', function(data) {

    if (data == 'reset') {
        rpio.pwmSetData(config.izquierdo.PWM, 0);
        rpio.pwmSetData(config.derecha.PWM, 0);

        rpio.write(config.izquierdo.dir[0], rpio.LOW);
        rpio.write(config.izquierdo.dir[1], rpio.LOW);
        rpio.write(config.derecha.dir[0], rpio.LOW);
        rpio.write(config.derecha.dir[1], rpio.LOW);

    } else if (data.eje == 'derecho') {
        var valor = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1024);
        if (data.data.y >= 0) {
            rpio.write(config.derecha.dir[0], rpio.HIGH);
            rpio.write(config.derecha.dir[1], rpio.LOW);
            // adelante
        } else {
            // atras
            rpio.write(config.derecha.dir[0], rpio.LOW);
            rpio.write(config.derecha.dir[1], rpio.HIGH);
        }
        rpio.pwmSetData(config.derecha.PWM, valor);
    } else if (data.eje == 'izquierdo') {
        var valor = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1024);
        if (data.data.y >= 0) {
            rpio.write(config.izquierdo.dir[0], rpio.HIGH);
            rpio.write(config.izquierdo.dir[1], rpio.LOW);
            // adelante
        } else {
            // atras
            rpio.write(config.izquierdo.dir[0], rpio.LOW);
            rpio.write(config.izquierdo.dir[1], rpio.HIGH);
        }
        rpio.pwmSetData(config.izquierdo.PWM, valor);
    }

});



rpio.open(config.acordeon[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.acordeon[1], rpio.OUTPUT, rpio.LOW);
socket.on('vertical', function(data) {

    switch (data) {
        case 'up':
            rpio.write(config.acordeon[1], rpio.HIGH);
            rpio.write(config.acordeon[0], rpio.LOW);
            break;
        case 'down':
            rpio.write(config.acordeon[1], rpio.LOW);
            rpio.write(config.acordeon[0], rpio.HIGH);
            break;
        case 'stop':
            rpio.write(config.acordeon[1], rpio.LOW);
            rpio.write(config.acordeon[0], rpio.LOW);
            break;
        default:
    }
});

rpio.open(config.pinza, rpio.PWM);
socket.on('pinza', function(data) {
    rpio.pwmSetData(config.pinza, data * 4);
});

socket.on('tv:ping', function(data) {
    socket.emit('tv:pong');
});

socket.on('disconnect', function() {
    stop();
});
