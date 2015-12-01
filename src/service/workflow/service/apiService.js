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
            if (!dto.params.hasOwnProperty(i)) {
                continue;
            }
            if(dto.params[i] != null){
                formData[i] = dto.params[i];
            }
        }

        for(var j in dto.files){

            if (!dto.files.hasOwnProperty(j)) {
                continue;
            }

            var file =  dto.files[j];
            var attachment =  fs.createReadStream( config.resources.location + '/' + file.path );
            if(formData[file.key] == undefined){
                formData[file.key] = attachment;
            } else if(Array.isArray(formData[file.key])) {
                formData[file.key].push( attachment );
            } else {
                var previousAttachment = formData[file.key];
                formData[file.key] = [previousAttachment, attachment];
            }
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

    this.loadRequestResponse = function (dto, id, fileData, outputPath, cb) {

        var url = dto.url + 'service' + '/' + id + '/download/' + fileData.id;
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

    this.killRequest = function (dto, cb) {
        var url = dto.url + 'service' + '/' + dto.id + '/kill';
        request.get( { url: url }, function (err, resp, body) {
            if (err) {
                logger.error(err.message);
                return cb(err.message);
            }
            return cb(null, JSON.parse(resp.body));
        });
    };

    this.getStatistics = function (url, cb) {
        request.get( { url: url + 'statistics' }, function (err, resp, body) {
            if (err) {
                logger.error(err.message);
                return cb(err.message);
            }
            return cb(null, JSON.parse(resp.body));
        });
    };
}

module.exports = new ApiService();

