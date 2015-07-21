/**
 * Created by priit on 18.06.15.
 */
global.__base = __dirname + '/../';

var express = require('express');
var app = express();

var log4js = require('log4js');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var cluster = require('cluster');
var http = require('http');
var config = require('./../config');
var sessionMiddleware = require('./../middlewares/session');
var sessionDebugger = require('./../middlewares/sessionDebugger');
var controllers = require('./../controllers/index');
var routerMiddleware = require('./../middlewares/router');
var errorhandlerMiddleware = require('./../middlewares/errorhandler');
var ServerUtil = require('./../src/util/server');

app.set('views', path.join(__base, 'views'));// view engine setup
app.set('view engine', 'jade');// view engine setup
app.use(express.static(__base + '/public'));

log4js.configure({
    appenders: [
        { type: 'console',
            layout: {
                type: 'pattern',
                pattern: "[%d] %[[%x{pid}] [%5.5p]%] %c - %m",
                tokens: {
                    pid: process.pid
                }
            }
        },
        { type: 'file', filename: __base + 'keeleliin-server.log' }
    ]
});

var log4jsLogger = log4js.getLogger('server_js');
app.use(logger('dev'));
app.use(bodyParser.json({limit: '1000mb'})); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(routerMiddleware);

app.use(sessionMiddleware);
app.use(sessionDebugger);
app.use(errorhandlerMiddleware.common);

app.use(controllers);
app.use(errorhandlerMiddleware.error404);

/**
 * Create HTTP server.
 */
function startCluster( instanceCount, cb ){

    if(instanceCount == null){
        instanceCount = require('os').cpus().length;
    }

    if (cluster.isMaster) {
        log4jsLogger.debug('Instances count: ' + instanceCount);
        for (var i = 0; i < instanceCount; i++) {
            cluster.fork();
        }

        cluster.on('exit', function(worker, code, signal) {
            log4jsLogger.info('worker ' + worker.process.pid + ' died; Code: ' + code + '; Signal: ' + signal);
        });
    } else {
        startInstance(cb);
    }
}

function startInstance(cb){
    var port = ServerUtil.normalizePort(config.port);
    app.set('port', port);
    var server = http.createServer(app);
    server.listen(port);
    server.on('error', ServerUtil.onError);
    server.on('listening', function () {
        var addr = server.address();
        var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        log4jsLogger.debug('Listening on ' + bind + ' process: ' + process.pid );
        cb();
    });
}



// *******************************************************
exports.startCluster = startCluster;
exports.startInstance = startInstance;
exports.app = app;
