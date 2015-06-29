/**
 * Created by priit on 2.06.15.
 */
global.__base = __dirname + '/';

var express = require('express');


var app = express();
var path = require('path');
var log4js = require('log4js');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var debug = require('debug')('keeleliin-server:server');
var http = require('http');
var config = require('./config');
var sessionMiddleware = require('./middlewares/session');
var sessionDebugger = require('./middlewares/sessionDebugger');

var controllers = require('./controllers');

var routerMiddleware = require('./middlewares/router');
var errorhandlerMiddleware = require('./middlewares/errorhandler');

app.set('views', path.join(__dirname, 'views'));// view engine setup
app.set('view engine', 'jade');// view engine setup

log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: 'keeleliin.log' }
    ]
});

app.use(logger('dev'));
app.use(bodyParser.json({limit: '10mb'})); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({ dest: './uploads/'})); // for parsing multipart/form-data
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next){
    next();
});
app.use(routerMiddleware);
app.use(sessionMiddleware);
app.use(sessionDebugger);
app.use(errorhandlerMiddleware.common);

app.use(controllers);
app.use(errorhandlerMiddleware.error404);

/**
 * Create HTTP server.
 */

var port = config.port;
app.set('port', config.port);
var server = http.createServer(app);
server.listen(config.port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;