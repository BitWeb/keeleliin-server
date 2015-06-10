/**
 * Created by priit on 28.05.15.
 *
 * Store and retrive objects from redis
 *
 */
var logger = require('log4js').getLogger('redis_dao_service');
var redis = require('redis');
redis.debug_mode = true;

var config = require(__base + 'config');

var DaoService = function(){
    var self = this;
    var connected = false;
    var prefix = 'dao:';

    this.client = redis.createClient(config.redis.port, config.redis.host, {});

    this.client.on('connect', function() {
        logger.debug('connected');
        self.connected = true;
    });

    this.client.on("error", function (err) {
        logger.debug("Redis Error " + err);
    });

    this.set =  function(key, value, cb){

        this.client.set(prefix + key, JSON.stringify(value), function (err, reply) {
            if(cb != undefined){
                cb(err, reply);
            }
        });
    };

    this.get = function(key, cb){
        this.client.get(prefix + key, function(err, reply) {
            if(cb != undefined){
                if(err){
                   return cb(err);
                }
                return cb(null, JSON.parse(reply));
            }
        });
    };

    this.delete = function(key, cb){
        this.client.del(prefix + key, function (err, reply) {
            if(cb != undefined){
                cb(err, reply);
            }
        } );
    };

    this.exists = function(key, cb){
        this.client.exists(prefix + key, cb);
    }
};

module.exports = new DaoService();