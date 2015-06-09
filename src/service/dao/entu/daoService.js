/**
 * Created by priit on 28.05.15.
 *
 * Store and retrive objects from ENTU
 */
var request = require('request');
request.debug = true;

var config = require(__base + 'config');
var Base64 = require("crypto-js/enc-base64");
var Utf8 = require("crypto-js/enc-utf8");
var HmacSHA1 = require("crypto-js/hmac-sha1");

var DaoService = function(){

    this.getAuthUrl = function( postData, callback ) {
        var options = {
            method  : 'POST',
            uri:config.entu.apiUrl + 'api2/user/auth',
            json: postData,
            headers : this._getRequestHeaders({})
        };

        request(options, function (error, response, body) {
            console.log('Entu auth url response:');
            console.log( body );
            return callback( error, body.auth_url );
        }).on('error', function(e) {
            console.log('problem with request: ' + e);
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

        request(options, function (error, response, body) {
            console.log('Entu response:');
            console.log( body );
            return callback( error, body );
        }).on('error', function(e) {
            console.log('problem with request: ' + e);
            return callback( e, null );
        });
    };

    this._getSignedData = function(userId, key, data) {
        if(!userId || !key) return;

        var conditions = [];
        for(k in data) {
            conditions.push({k: data[k]});
        }

        var expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 60);

        data.user = userId;
        data.policy = Base64.stringify(Utf8.parse(JSON.stringify({expiration: expiration.toISOString(), conditions: conditions})));
        data.signature = Base64.stringify(HmacSHA1(data.policy, key));
        return data;
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

        if(meta.apiKey){
            data = this._getSignedData(meta.userId, meta.apiKey, data);
        }

        var options = {
            method  : 'GET',
            uri     : config.entu.apiUrl + 'api2/entity',
            form    : data,
            headers : this._getRequestHeaders(meta)
        };

        request(options, function (error, response, body) {
            callback( error, body );
        }).on('error', function(e) {
            console.log('problem with request: ' + e);
        });
    }
};

module.exports = new DaoService();