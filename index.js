/*
  Taller Vertical 2016, IMT, ITESM GDA
  Codigo de Raspberry PI
*/

/*
  Esta primer seccion se importan las librerias relacionadas con la captura de imagen y otros.
*/
var cv = require('opencv'),
    async = require('async'),
    _in = false;

var start = () => _in = true,
    stop = () => _in = false

/*
  Intento de conexion con camara.
*/
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


/*
  Libreria de GPIO y PWM.
*/
var rpio = require('rpio');

const map = (x, in_min, in_max, out_min, out_max) => (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;


/*
  Conexion con el servidor socket.io
*/
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

/*
  Configuraciones.
*/
rpio.init({gpiomem: false, mapping: 'physical'});

/*
  Mapeo de pin de PI.
*/
const config = {
    derecha: {
        PWM: 12,
        dir: [
            16, 18
        ],
        mirror: [13, 15]
    },
    izquierdo: {
        PWM: 33,
        dir: [
            31, 29
        ],
        mirror: [11, 7]
    },
    pinza: 35, // PWM
    acordeon: [38, 37]
};

rpio.open(config.izquierdo.PWM, rpio.OUTPUT);
rpio.open(config.derecha.PWM, rpio.OUTPUT);

rpio.open(config.derecha.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.derecha.dir[1], rpio.OUTPUT, rpio.HIGH);
rpio.open(config.izquierdo.dir[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.izquierdo.dir[1], rpio.OUTPUT, rpio.HIGH);

rpio.open(config.derecha.mirror[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.derecha.mirror[1], rpio.OUTPUT, rpio.HIGH);
rpio.open(config.izquierdo.mirror[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.izquierdo.mirror[1], rpio.OUTPUT, rpio.HIGH);


rpio.pwmSetClockDivider(Math.pow(2, 5));


/*
  PWM por software para la velocidad de motores.
*/
var total = 100, PWM1 = 0.2, PWM2 = 0.2;

/*
  Motor izquierdo
*/
async.forever(function(done){
	rpio.write(config.izquierdo.PWM, rpio.HIGH);
	setTimeout(() => {
		rpio.write(config.izquierdo.PWM, rpio.LOW);
		setTimeout(done, total * (1-PWM1))
	}, total * PWM1)
});

/*
  Motor derecho
*/
async.forever(function(done){
	rpio.write(config.derecha.PWM, rpio.HIGH);
	setTimeout(() => {
		rpio.write(config.derecha.PWM, rpio.LOW);
		setTimeout(done, total * (1-PWM2))
	}, total * PWM2)
});


socket.on('motor', function(data) {
	/*
	  Direccion de motores
	*/
    if (data == 'reset') {
        rpio.write(config.izquierdo.dir[0], rpio.LOW);
        rpio.write(config.izquierdo.dir[1], rpio.LOW);
        rpio.write(config.derecha.dir[0], rpio.LOW);
        rpio.write(config.derecha.dir[1], rpio.LOW);

        rpio.write(config.izquierdo.mirror[0], rpio.LOW);
        rpio.write(config.izquierdo.mirror[1], rpio.LOW);
        rpio.write(config.derecha.mirror[0], rpio.LOW);
        rpio.write(config.derecha.mirror[1], rpio.LOW);

    } else if (data.eje == 'derecho') {
        PWM1 = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1);
        if (data.data.y >= 0) {
            rpio.write(config.derecha.dir[0], rpio.HIGH);
            rpio.write(config.derecha.dir[1], rpio.LOW);
            rpio.write(config.derecha.mirror[0], rpio.HIGH);
            rpio.write(config.derecha.mirror[1], rpio.LOW);
        } else {
            rpio.write(config.derecha.dir[0], rpio.LOW);
            rpio.write(config.derecha.dir[1], rpio.HIGH);
            rpio.write(config.derecha.mirror[0], rpio.LOW);
            rpio.write(config.derecha.mirror[1], rpio.HIGH);
        }
    } else if (data.eje == 'izquierdo') {
        PWM2 = map(Math.abs(data.data.y), 6000, Math.pow(2, 15), 0, 1);
        if (data.data.y >= 0) {
            rpio.write(config.izquierdo.dir[0], rpio.HIGH);
            rpio.write(config.izquierdo.dir[1], rpio.LOW);
            rpio.write(config.izquierdo.mirror[0], rpio.HIGH);
            rpio.write(config.izquierdo.mirror[1], rpio.LOW);
        } else {
            rpio.write(config.izquierdo.dir[0], rpio.LOW);
            rpio.write(config.izquierdo.dir[1], rpio.HIGH);
            rpio.write(config.izquierdo.mirror[0], rpio.LOW);
            rpio.write(config.izquierdo.mirror[1], rpio.HIGH);
        }
    }

});

/*
  Control de la grua
*/
rpio.open(config.acordeon[0], rpio.OUTPUT, rpio.LOW);
rpio.open(config.acordeon[1], rpio.OUTPUT, rpio.LOW);
socket.on('vertical', function(data) {
    console.log('ver', data);
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


/*
  Control de la pinza
*/
rpio.open(config.pinza, rpio.PWM);
socket.on('pinza', function(data) {
    rpio.pwmSetData(config.pinza, data.data * 4);
});

socket.on('tv:ping', function(data) {
    socket.emit('tv:pong');
});

socket.on('disconnect', function() {
    stop();
});
