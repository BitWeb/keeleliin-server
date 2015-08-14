/**
 * Created by priit on 26.05.15.
 */

var config = {};

config.port = 3000;
config.apiKey = '';

config.redis = {
    host: "127.0.0.1",
    port: 6379
};

config.sql = {
    dialect     : 'postgres',
    database    : 'keeleliin',
    username    : '',
    password    : '',
    port        : 5432
};

config.entu = {
    apiUrl: 'https://entu.keeleressursid.ee/'
};

config.resources = {
    location: __dirname + '/../keeleliin-files',
    downloadLocation: __dirname + '/../keeleliin-files/downloads',
    tmp: '/tmp'
};

config.log4js = {
    appenders: [
        {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: "[%d] %[[%x{port}-%x{pid}][%5.5p]%] %c - %m",
                tokens: {
                    pid: process.pid,
                    port: config.port
                }
            }
        },
        {
            type: 'file',
            layout: {
                type: 'pattern',
                pattern: "[%d] [%x{port}-%x{pid}][%5.5p] %c - %m",
                tokens: {
                    pid: process.pid,
                    port: config.port
                }
            },
            filename: __dirname + '/keeleliin-server.log'
        },
        {
            "type": "logLevelFilter",
            layout: {
                type: 'pattern',
                pattern: "[%d] [%x{port}-%x{pid}][%5.5p] %c - %m",
                tokens: {
                    pid: process.pid,
                    port: config.port
                }
            },
            "level": "ERROR",
            "appender": {
                "type": "smtp",
                "layout": {
                    type: 'pattern',
                    pattern: "[%d] [%x{port}-%x{pid}][%5.5p] %c - %m",
                    tokens: {
                        pid: process.pid,
                        port: config.port
                    }
                },
                "recipients": "someting@gmail.com",
                "sendInterval": 10, //sec
                "transport": "SMTP",
                "SMTP": {
                    "host": "smtp.gmail.com",
                    "secureConnection": false,
                    "port": 587,
                    "auth": {
                        "user": "***********",
                        "pass": "***********"
                    },
                    "debug": true
                }
            }
        }
    ]
};

config.mail = {
    transporterOptions: {
        service: 'gmail',
        //host: '',
        //post: '',
        auth: {
            user: 'youruser@gmail.com',
            pass: '******************'
        }
    },

    sendAllMailsTo: ['youruser@gmail.com']
};

module.exports = config;
