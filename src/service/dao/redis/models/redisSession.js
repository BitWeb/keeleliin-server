/**
 * Created by priit on 8.06.15.
 */

var daoService = require('../daoService');

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

            console.log('DATA GOT ON INIT');
            console.log(self.data);

            callback();
        });
    };

    this.save = function (callback) {
        console.log('SAVE: ' + self.id);
        console.log(self.data);
        daoService.set(self.id, self.data, callback);
    };

    this.delete = function (callback) {
        daoService.delete(self.id, callback);
    };

    this.init( cb );
}

module.exports = RedisSession;