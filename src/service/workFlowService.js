/**
 * Created by taivo on 12.06.15.
 */


var resourceService = require(__base + 'src/service/resourceService');
var GrepWrapper = require(__base + 'src/wrapper/grepWrapper/grepWrapper');

function WorkFlowService() {

    var self = this;

    this.test = function(req, callback) {
        resourceService.getResource(10, function (err, resource) {
            if (err) {
                throw err;
            }

            var grepWrapper = new GrepWrapper();
            grepWrapper.send(resource, function(err, response) {
                if (err) {
                    return callback(err);
                }

                return callback(null, response);
            });
        });
    }
}

module.exports = new WorkFlowService();