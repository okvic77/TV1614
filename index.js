/*
  Taller Vertical 2016, IMT, ITESM GDA
  Codigo de servidor socket.io
*/

/*
  Esta primer seccion se importan las librerias selacionadas con el control de xBox y el procesamiento de imagen.
*/

var XboxController = require('xbox-controller'),
    winston = require('winston'),
    _ = require('underscore');
var xbox = new XboxController;
var gm = require('gm').subClass({
    imageMagick: true
});

/*
  Se enviaran distintos mensajes dependiendo del estado de conexion con el control.
*/
xbox.on('connected', () => winston.info('Xbox controller connected'));
xbox.on('not-found', () => winston.error('Xbox controller could not be found'));
xbox.setLed(0x01);

/*
  Importamos y declaramos variables relacionadas con el servidor TCP (socket.io).
*/

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

/*
  Abrimos el puerto 7000 a todas las interfaces.
*/

server.listen(7000, function() {
    winston.info('web', server.address())
});

/*
  Configuraciones generales del servidor http, en el cual se monto socket.io
*/

app.set('view engine', 'pug');
app.use('/static', express.static('public'), express.static('bower_components'));
app.get('/', function(req, res) {
    res.render('main');
});

/*
  Servicio de socket.io
*/

var save = false; // Variable para definir si al recibir una imagen esta debe ser almacenada.
io.of('/pi').on('connection', function(pi) {
  /*
    Variables locales para cada conexion de Raspberry Pi
  */

    var pingpong;
    console.log('connection');
    xbox.setLed(0x06); // Led de xBox

    /*
      Eventos adjuntos al xBox al momento de conexion de una Raspberry Pi.
    */

    var events = {
        'a:press': () => pi.emit('vertical', 'reset'),
        'y:press': () => pi.emit('pinza', 'reset'),
        'x:press': () => pi.emit('horizontal', 'reset'),
        'b:press': () => {
            pi.emit('vertical', 'reset')
            pi.emit('pinza', 'reset')
            pi.emit('horizontal', 'reset')
        },

        'lefttrigger': position => pi.emit('pinza', {
            dir: 'open',
            data: position
        }),
        'righttrigger': position => pi.emit('pinza', {
            dir: 'close',
            data: position
        }),


        /*
          Enviar y recibir un evento a la raspberry.
        */


        'start:press': () => {
            pingpong = new Date();
            winston.info('ping')
            pi.emit('tv:ping');
        },


        'dup:press': () => pi.emit('vertical', 'up'),
        'dup:release': () => pi.emit('vertical', 'stop'),
        'ddown:press': () => pi.emit('vertical', 'down'),
        'ddown:release': () => pi.emit('vertical', 'stop'),


        'rightshoulder:press': () => pi.emit('motor', 'reset'),
        'left:move': position => {
            if (position.x != 0 || position.y != 0)
                pi.emit('motor', {
                    eje: 'izquierdo',
                    data: position
                })
        },
        'right:move': position => {
            if (position.x != 0 || position.y != 0)
                pi.emit('motor', {
                    eje: 'derecho',
                    data: position
                })
        },
        'leftshoulder:press': () => save = true,
    };

    /*
      Ajuntar los eventos al xbox
    */

    _.each(events, (evento, key) => xbox.on(key, evento))

    /*
      Mostrar la respuesta de la Pi al evento de ping.
    */

    pi.on('tv:pong', function(data) {
        winston.info('pong', `${new Date() - pingpong}ms`);
    });

    /*
      Al recibir imagen, almacenarla si es necesario y emitirla a los suscriptores en el canal stream.
    */


    pi.on('image', function(data, done) {
        done();
        io.of('/stream').emit('image', {
            image: true,
            save: save,
            data: data.toString('base64')
        });
        if (save) gm(data, 'image.jpg').write(`log/${new Date().toISOString()}.jpg`, err => winston.info('save', err));

        save = false;

    });

    /*
      Al desconectarse la Pi, quitar los eventos adjuntos al xBox contoller, cambiar el indicador del control.
    */

    pi.on('disconnect', function() {
        _.each(events, (evento, key) => xbox.removeListener(key, evento))
        xbox.setLed(0x01);
        console.log('desconectado');
    })
});


/*
  Mostrar si usuario se conecto para recibir imagenes.
*/

io.of('/stream').on('connection', user => {
    console.log('user connected')
    user.on('disconnect', function() {
        console.log('user disconnected')
    })
})
