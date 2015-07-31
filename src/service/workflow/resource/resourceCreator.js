/**
 * Created by priit on 22.07.15.
 */
var logger = require('log4js').getLogger('resource_creator');
var config = require(__base + 'config');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var FileUtil = require(__base + 'src/service/util/fileUtil');

function ResourceCreator(sourceResource, workflowService, resourceIndex){
    var self = this;

    this.sourceResource = sourceResource;
    this.workflowService = workflowService;
    this.resourceIndex = resourceIndex;

    var encoding = 'utf-8';
    var resourceFilename;
    var writer;

    this.write = function (data, cb) {

        if(!resourceFilename){
            self._getNewResourceFilename(self.sourceResource, self.workflowService, self.resourceIndex, function (err, filename) {
                resourceFilename = filename;
                writer = fs.createWriteStream( config.resources.location + '/' + resourceFilename);
                self._writeToFile(data, cb);
            });
        } else {
            self._writeToFile(data, cb);
        }
    };

    this._writeToFile = function (data, cb) {
        writer.write(data, encoding, function () {
            cb();
        });
    };

    this.finish = function (cb) {

        writer.on("finish", function () {
            logger.trace('Writer finished');
            self._getNewResource(cb);
        });
        writer.end();
    };

    this._getNewResource = function( cb ){

        var data = {
            resource_type_id: self.sourceResource.resource_type_id,
            filename: resourceFilename,
            content_type: self.sourceResource.content_type,
            encoding: self.sourceResource.encoding,
            name: self.getOriginalName(),
            original_name: self.getOriginalName()
        };

        var resource = Resource.build(data);
        resource.save().then(function(resource) {
            logger.debug('Resource created');
            cb(null, resource);
        }).catch(function (err) {
            logger.error(err);
            cb(err.message);
        });
    };

    this._getNewResourceFilename = function (resource, workflowService, index, cb) {
        self._getWorkflowFolder(workflowService, function (err, folder) {
            var filename = folder +'/split_result_' + resource.id +'_'+index;
            cb(null, filename);
        });
    };

    this._getWorkflowFolder = function (workflowService, cb) {
        var rootLocation = config.resources.location;
        var location = '/workflow_' + self.workflowService.workflow_id;
        fs.exists(rootLocation + location, function (exists) {
            if(exists){
                return cb(null, location);
            }
            fs.mkdir(rootLocation + location, function (err) {
                return cb(err, location);
            })
        });
    };

    this.getOriginalName = function () {

        var sourceName = self.sourceResource.original_name;
        var extension = FileUtil.getExtension(sourceName);

        var name = FileUtil.getName(sourceName);
        if(self.resourceIndex){
            name = name + '_' + self.resourceIndex;
        }
        if(extension){
            name = name + '.' + extension;
        }

        return name;
    };
}

module.exports = ResourceCreator;
