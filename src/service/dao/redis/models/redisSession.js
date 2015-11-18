/**
 * Created by priit on 8.06.15.
 */

var daoService = require('../daoService');
var logger = require('log4js').getLogger('redis_session');
var uid = require('uid-safe').sync;
var async = require('async');

function RedisSession( id, cb ){
    var self = this;
    this.data = {};
    this.id = id;

    this.save = function (callback) {
        /*logger.debug('SAVE: ' + self.id);
        logger.debug(self.data);*/
        daoService.set(self.id, self.data, callback);
    };

    this.delete = function (callback) {
        daoService.delete(self.id, callback);
    };

    async.waterfall([
        function (callback) {
            if( !self.id ){
                self.id = uid(24);
                logger.info('New session: ' + self.id);
            }
            callback();
        },
        function (callback) {
            daoService.get(self.id, function (err, data) {
                if(err || data == null || data == undefined){
                    self.data = {id: self.id};
                } else {
                    self.data = data;
                }

                /*logger.debug('DATA GOT ON INIT');
                logger.debug(self.data);*/
                callback();
            });
        }
    ], cb);
}

module.exports = RedisSession;