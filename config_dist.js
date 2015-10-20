
var config = {};

config.port = 3000;

//Kliendirakenduse url
config.appUrl = 'http://localhost:8001';

//Api võti wrapperitele
config.apiKey = 'server-wrapper-api-key';

config.entu = {
    apiUrl: 'https://entu.keeleressursid.ee/'
};

config.redis = {
    host: process.env.REDIS_PORT_6379_TCP_ADDR || "127.0.0.1",
    port: process.env.REDIS_PORT_6379_TCP_PORT || 6379
};

config.sql = {
    dialect     : 'postgres',
    database    : 'keeleliin',
    username    : process.env.POSTGRES_ENV_POSTGRES_USER || 'postgres',
    password    : process.env.POSTGRES_ENV_POSTGRES_PASSWORD || 'postgres',
    host        : process.env.POSTGRES_PORT_5432_TCP_ADDR || 'localhost',
    port        : process.env.POSTGRES_PORT_5432_TCP_PORT || 5432
};

config.resources = {
    location: '/keeleliin_files',
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
