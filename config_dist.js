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

module.exports = config;
