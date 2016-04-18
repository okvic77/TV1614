var XboxController = require('xbox-controller'),
    winston = require('winston');
var xbox = new XboxController;

/* Resets */
xbox.on('x:press', key => winston.info('reset horizontal'));
xbox.on('x:release', key => winston.info('reset horizontal:stop'));

xbox.on('a:press', key => winston.info('reset vertical'));
xbox.on('a:release', key => winston.info('reset vertical:stop'));

xbox.on('y:press', key => winston.info('reset pinzas'));
xbox.on('y:release', key => winston.info('reset pinzas:stop'));

xbox.on('b:press', key => winston.info('reset'));
xbox.on('b:release', key => winston.info('reset:stop'));

/* Pinza control */
xbox.on('lefttrigger', (position) => winston.info('pinza abrir', position));
xbox.on('righttrigger', (position) => winston.info('pinza cerrar', position));

/* Motores de dirección */
xbox.on('left:move', position => {
    if (position.x != 0 || position.y != 0)
        winston.info('motor', position)
});
//xbox.on('right:move', (position) => winston.info('right:move', position));

/* Acordeon vertical */
xbox.on('dup:press', key => winston.info('acordeon vertical subir:start'));
xbox.on('dup:release', key => winston.info('acordeon vertical subir:stop'));
xbox.on('ddown:press', key => winston.info('acordeon vertical bajar:start'));
xbox.on('ddown:release', key => winston.info('acordeon vertical bajar:stop'));

/* Acordeon horizontal */
xbox.on('dleft:press', key => winston.info('acordeon horizontal expandir:start'));
xbox.on('dleft:release', key => winston.info('acordeon horizontal expandir:stop'));
xbox.on('dright:press', key => winston.info('acordeon horizontal contraer:start'));
xbox.on('dright:release', key => winston.info('acordeon horizontal contraer:stop'));

xbox.on('connected', () => {
    winston.info('Xbox controller connected');
    xbox.setLed(0x01);
});

xbox.on('not-found', () => winston.error('Xbox controller could not be found'));
