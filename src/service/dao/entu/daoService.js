/**
 * Created by priit on 28.05.15.
 */
var request = require('request');
request.debug = true;
var http = require('http');
var https = require('https');


var logger = require('log4js').getLogger('entu_dao_service');
var config = require(__base + 'config');
var fs = require('fs');

var DaoService = function(){

    var self = this;

    this.getAuthUrl = function( postData, callback ) {
        var options = {
            method  : 'POST',
            uri:config.entu.apiUrl + 'api2/user/auth',
            json: postData,
            headers : this._getRequestHeaders({})
        };

        request(options, function (error, response, body) {
            logger.debug('Entu auth url response:');
            logger.debug( body );
            return callback( error, body.result.auth_url );
        }).on('error', function(e) {
            logger.debug('problem with request: ' + e);
            return callback(e);
        });
    };

    this.getUser = function(url, state, callback){

        var options = {
            method  : 'POST',
            uri: url,
            json: {
                state: state
            },
            headers : this._getRequestHeaders({})
        };

        request( options , function (error, response, body) {
            if(error){
                if(error instanceof Error){
                    error = error.message;
                }
                return callback( error );
            }

            return callback( null, body );
        }).on('error', function(e) {
            logger.debug('problem with request: ' + e);
            return callback( e, null );
        });
    };

    this._getRequestHeaders = function ( meta ) {
        var headers = {
            'Content-Type': 'application/json'
        };

        if(meta.sessionKey){
            headers['X-Auth-UserId'] = meta.userId;
            headers['X-Auth-Token'] = meta.sessionKey;
        }

        return headers;
    };

    this.getEntities = function(data, meta, callback){

        var options = {
            method  : 'GET',
            uri     : config.entu.apiUrl + 'api2/entity',
            form    : data,
            headers : this._getRequestHeaders(meta)
        };

        request(options, function (error, response, body) {
            return callback( error, JSON.parse(body) );
        }).on('error', function(e) {
            logger.debug('problem with request: ' + e);
            return callback( e );
        });
    };

    this.getEntity = function(id, meta, callback){

        logger.debug('Get entu entity');

        var options = {
            method  : 'GET',
            uri     : config.entu.apiUrl + 'api2/entity-' + id,
            headers : self._getRequestHeaders(meta)
        };

        request(options, function (error, response, body) {
            if(error){
                return callback( error );
            }

            var parsedBody = null;

            try {
                parsedBody = JSON.parse(body);
            } catch (e){
                return callback( e);
            }

            return callback( null, parsedBody );
        }).on('error', function(e) {
            logger.debug('problem with request: ' + e);
            return callback( e );
        });
    };

    this.downloadFile = function ( fileId, targetPath, meta, cb) {

        logger.debug('Get entu file');

        var options = {
            method  : 'GET',
            uri     : config.entu.apiUrl + 'api2/file-' + fileId,
            headers : self._getRequestHeaders(meta)
        };

        var r = request(options);

        r.on("response", function (res) {

            var regexp = /filename=\"(.*)\"/gi;
            var filename = regexp.exec( res.headers['content-disposition'] )[1];

            if (res.statusCode === 200) {

                var resourceFile = fs.createWriteStream(targetPath);
                res.pipe(resourceFile);
                resourceFile.on('finish', function() {
                    return cb(null, filename);
                });
                resourceFile.on('error', function(err) {
                    logger.error('GOT ERROR: ', + err);
                    return cb(err);
                });
            } else {
                r.abort();
                logger.error('Faili ei leitud');
                return cb('Faili ei leitud');
            }
        }).on('error', function(e) {
            logger.debug('problem with request: ' + e);
            return cb( e );
        });
    }
};

module.exports = new DaoService();