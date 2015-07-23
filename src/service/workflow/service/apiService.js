/**
 * Created by priit on 1.07.15.
 */
var logger = require('log4js').getLogger('api_service');
var request = require('request');
var fs = require('fs');
var http = require('http');
var config = require(__base  + 'config');

function ApiService(){

    this.makeRequest = function(dto, cb){

        var url = dto.url + 'service';

        var formData = {};

        for(var i in dto.params){
            if(dto.params[i] != null){
                formData[i] = dto.params[i];
            }
        }

        for(var j in dto.files){
            formData[j] = fs.createReadStream( config.resources.location + '/' + dto.files[j] );
        }

        request.post( { url: url, formData: formData }, function (err, resp, body) {
            if (err) {
                logger.error(err.message);
                return cb(err.message);
            }
            cb(null, JSON.parse(resp.body));
        });
    };

    this.recheckRequest = function (dto, id, cb) {
        var url = dto.url + 'service' + '/' + id;
        request.get( { url: url }, function (err, resp, body) {
            if (err) {
                logger.error(err.message);
                return cb(err.message);
            }
            return cb(null, JSON.parse(resp.body));
        });
    };

    this.loadRequestResponse = function (dto, id, key, outputPath, cb) {

        var url = dto.url + 'service' + '/' + id + '/' + key;
        var file = fs.createWriteStream( config.resources.location + '/' + outputPath );
        var request = http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                logger.debug(url + ' downloaded');
                file.close(cb);  // close() is async, call cb after close completes.
            });
        }).on('error', function(err) { // Handle errors
            if (cb) cb(err.message);
        });
    };
}

module.exports = new ApiService();

