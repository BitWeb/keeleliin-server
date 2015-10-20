var logger = require('log4js').getLogger('init_sql');
var config    = require(__base + 'config');
var pg = require('pg');
var sqlModel = require(__base + 'src/service/dao/sql');
var fs = require('fs');

module.exports.init = function(callback) {

    logger.trace( process.env );

    var conStringPri = 'postgres://' + config.sql.username + ':' + config.sql.password + '@' + config.sql.host + '/postgres';

    pg.connect(conStringPri, function(err, client, done) {
        if(err){
            logger.error('DB connect ', err);
            return callback();
        }

        client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname = '" + config.sql.database + "'", function(err, data) {
            if(data.rowCount > 0){
                logger.debug('Database exists');
                return callback();
            }

            client.query(" CREATE DATABASE " + config.sql.database + " WITH ENCODING 'UTF-8' TEMPLATE template0 ", function(err) {
                if( err ){
                    logger.debug('Database creation Error', err);
                }
                sqlModel.sequelize.sync( { force: true }).then(function () {
                    var initSql = fs.readFileSync(__base + 'sql/initBaseContentQuery.sql').toString();
                    logger.debug(initSql);
                    sqlModel.sequelize.query(initSql).then(function () {
                        client.end();
                        return callback();
                    })
                }).catch(function (err) {
                    logger.error(err);
                });
            });
        });
    });
};