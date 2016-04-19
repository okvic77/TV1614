var XboxController = require('xbox-controller'),
    winston = require('winston'),
    _ = require('underscore');
var xbox = new XboxController;

xbox.on('connected', () => {
    winston.info('Xbox controller connected');
});

xbox.on('not-found', () => winston.error('Xbox controller could not be found'));
xbox.setLed(0x01);


var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(7000, function() {
    winston.info('web', server.address())
});
app.set('view engine', 'pug');
app.get('/', function(req, res) {
    res.render('main');
});

io.on('connection', function(pi) {
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


        'dup:press': () => pi.emit('vertical', 'up:start'),
        'dup:release': () => pi.emit('vertical', 'up:stop'),
        'ddown:press': () => pi.emit('vertical', 'down:start'),
        'ddown:release': () => pi.emit('vertical', 'down:stop'),


        'dleft:press': () => pi.emit('horizontal', 'in:start'),
        'dleft:release': () => pi.emit('horizontal', 'in:stop'),
        'dright:press': () => pi.emit('horizontal', 'out:start'),
        'dright:release': () => pi.emit('horizontal', 'out:stop'),

        'rightshoulder:press': () => pi.emit('motor', 'reset'),
        'left:move': position => {
            if (position.x != 0 || position.y != 0)
                pi.emit('motor', {
                    eje: false,
                    data: position
                })
        },
        'right:move': position => {
            if (position.x != 0 || position.y != 0)
                pi.emit('motor', {
                    eje: true,
                    data: position
                })
        }
    };


    _.each(events, (evento, key) => xbox.on(key, evento))
    pi.on('tv:pong', function(data) {
        winston.info('pong', `${new Date() - pingpong}ms`);
    });

    pi.on('image', function(data) {
        winston.info('imagen');
    });

    pi.on('disconnect', function() {
        _.each(events, (evento, key) => xbox.removeListener(key, evento))
        xbox.setLed(0x01);
        console.log('desconectado');
    })
});
