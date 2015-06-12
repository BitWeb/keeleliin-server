/**
 * Created by taivo on 12.06.15.
 */

var GrepWrapperContent = require(__base + 'src/wrapper/grepWrapper/grepWrapperContent');
var fs = require('fs');
var http = require('http');

/**
 * TODO: needs to be abstract work flow service instance which is executed in WorkFlowService (or similar) class
 */
function GrepWrapper() {

    GrepWrapper.prototype.send = function(resource, callback) {
        var self = this;
        fs.readFile(resource.filename, function(err, data) {
            var pipeContent = JSON.parse(data);
            var grepWrapperContent = new GrepWrapperContent();
            grepWrapperContent.service.pipecontent = pipeContent;

            var postData = JSON.stringify(grepWrapperContent);

            self.sendRequest(postData, function(err, response) {
                if (err) {
                    return callback(err);
                }

                return callback(null, response);
            });
        })
    };

    GrepWrapper.prototype.sendRequest = function(content, callback) {
        console.log('Content: ' + content);
        var request = http.request({
            hostname: 'dev.bitweb.ee',
            port: 3001,
            path: '/api/v1/service',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': content.length
            }
        }, function(res) {
            console.log('Content: ' + content);
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            var response = "";
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                console.log('Writing data');
                response += chunk;
            });
            res.on('end', function() {
                console.log('End');
                return callback(null, response);
            });

        });
        request.on('error', function(error) {
            console.log('Error');
            console.log(error);
            return callback(error);
        });

        request.write(content);
        request.end();
    };

};

module.exports = GrepWrapper;