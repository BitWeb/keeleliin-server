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
    location: '../keeleliin-files',
    downloadLocation: '../keeleliin-files/downloads'
};

config.lof4js = {
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
        { type: 'file',
            filename: __dirname + 'keeleliin-server.log'
        },
        {
            "type": "smtp",
            "recipients": "***********",
            "sendInterval": 5,
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
            },
            "category": "mailer"
        }
    ]
};

module.exports = config;
