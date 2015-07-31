/**
 * Created by priit on 26.05.15.
 */

var config = {};

config.port = 3000;

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
    downloadLocation: __dirname + '/../keeleliin-files/downloads'
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
                "recipients": "priit@bitweb.ee",
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

module.exports = config;
