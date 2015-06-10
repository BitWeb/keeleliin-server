/**
 * Created by priit on 8.06.15.
 */

var daoService = require('../daoService');
var logger = require('log4js').getLogger('redis_dao_service');

function RedisSession( id, cb ){
    var self = this;
    this.data = {};
    this.id = id;

    this.init = function ( callback ) {
        daoService.get(self.id, function (err, data) {
            if(err || data == null || data == undefined){
                self.data = {id: self.id};
            } else {
                self.data = data;
            }

            logger.debug('DATA GOT ON INIT');
            logger.debug(self.data);
            callback();
        });
    };

    this.save = function (callback) {
        logger.debug('SAVE: ' + self.id);
        logger.debug(self.data);
        daoService.set(self.id, self.data, callback);
    };

    this.delete = function (callback) {
        daoService.delete(self.id, callback);
    };

    this.init( cb );
}

module.exports = RedisSession;