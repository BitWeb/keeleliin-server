/**
 * Created by priit on 22.07.15.
 */
var logger = require('log4js').getLogger('resource_creator');
var config = require(__base + 'config');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var FileUtil = require(__base + 'src/util/fileUtil');
var async = require('async');

function ResourceCreator(sourceResource, workflowService, resourceIndex, project, workflow){
    var self = this;

    this.sourceResource = sourceResource;
    this.workflowService = workflowService;
    this.resourceIndex = resourceIndex;
    this.project = project;
    this.workflow = workflow;

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
            logger.trace('Writer finished: ' + resourceFilename);
            self._getNewResource(cb);
        });
        writer.end();
    };

    this._getNewResource = function( cb ){

        async.waterfall([
            function collectData(callback) {
                var data = {
                    resourceTypeId: self.sourceResource.resourceTypeId,
                    filename: resourceFilename,
                    contentType: self.sourceResource.contentType,
                    encoding: self.sourceResource.encoding,
                    name: self.getOriginalName(),
                    originalName: self.getOriginalName()
                };
                callback(null, data);
            },
            function createResource(data, callback) {

                var resource = Resource.build(data);
                resource.save().then(function(resource) {
                    logger.debug('Resource created');
                    callback(null, resource);
                }).catch(function (err) {
                    logger.error(err);
                    callback(err.message);
                });
            },
            function addResourceToProject(resource, callback) {
                project.addResource(resource).then(function () {
                    callback(null, resource);
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], cb);
    };

    this._getNewResourceFilename = function (resource, workflowService, index, cb) {
        self._getWorkflowFolder(workflowService, function (err, folder) {
            var filename = folder +'/split_result_' + resource.id +'_'+index;
            cb(null, filename);
        });
    };

    this._getWorkflowFolder = function (workflowService, cb) {
        var rootLocation = config.resources.location;
        var location = '/workflow_' + self.workflowService.workflowId;
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

        var sourceName = self.sourceResource.originalName;
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
