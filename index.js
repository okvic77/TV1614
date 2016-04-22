var XboxController = require('xbox-controller'),
    winston = require('winston'),
    _ = require('underscore');
var xbox = new XboxController;
var gm = require('gm').subClass({
    imageMagick: true
});

xbox.on('connected', () => {
    winston.info('Xbox controller connected');
});

xbox.on('not-found', () => winston.error('Xbox controller could not be found'));
xbox.setLed(0x01);

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(7000, function() {
    winston.info('web', server.address())
});
app.set('view engine', 'pug');
app.use('/static', express.static('public'), express.static('bower_components'));
app.get('/', function(req, res) {
    res.render('main');
});
var save = false;
io.of('/pi').on('connection', function(pi) {
    var pingpong;
    console.log('connection');
    xbox.setLed(0x06);
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




        'start:press': () => {
            pingpong = new Date();
            winston.info('ping')
            pi.emit('tv:ping');
        },


        'dup:press': () => pi.emit('vertical', 'up'),
        'dup:release': () => pi.emit('vertical', 'stop'),
        'ddown:press': () => pi.emit('vertical', 'down'),
        'ddown:release': () => pi.emit('vertical', 'stop'),


        // 'dleft:press': () => pi.emit('horizontal', 'in:start'),
        // 'dleft:release': () => pi.emit('horizontal', 'in:stop'),
        // 'dright:press': () => pi.emit('horizontal', 'out:start'),
        // 'dright:release': () => pi.emit('horizontal', 'out:stop'),

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


    _.each(events, (evento, key) => xbox.on(key, evento))
    pi.on('tv:pong', function(data) {
        winston.info('pong', `${new Date() - pingpong}ms`);
    });

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

    pi.on('disconnect', function() {
        _.each(events, (evento, key) => xbox.removeListener(key, evento))
        xbox.setLed(0x01);
        console.log('desconectado');
    })
});

io.of('/stream').on('connection', user => {
    console.log('user connected')

    user.on('disconnect', function() {
        console.log('user disconnected')
    })
})
