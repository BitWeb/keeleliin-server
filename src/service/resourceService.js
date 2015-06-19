/**
 * Created by taivo on 11.06.15.
 */

var fs = require('fs');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var PipeContent = require(__base +  'src/pipecontent/content');
var path = require('path');

function ResourceService() {

    this.getResource = function(req, resourceId, callback) {

        Resource.find({ where: {id: resourceId }}).then(function(resource) {

            return callback(null, resource);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getProjectResources = function(req, projectId, callback) {

        return resourceDaoService.getProjectResources(projectId, callback);
    };

    this.getResources = function(req, callback) {
        var pagination = {
            total: (req.params.total ? req.params.total : 100),
            offset: (req.params.offset ? req.params.offset : 0)
        };

        return resourceDaoService.getResources(pagination, callback);
    };

    this.saveResource = function(req, resourceId, resourceData, callback) {

        resourceDaoService.getResource(resourceId, function (err, resource) {
            if (err) {
                return callback(err);
            }

            /**
             * TODO: a separate mapper
             */
            if (resourceData.source_file_location != undefined) {
                resource.source_file_location = resourceData.source_file_location;
            }

            if (resourceData.file_location != undefined) {
                resource.file_location = resourceData.file_location;
            }

            resource.save().then(function (updatedResource) {
                return callback(null, updatedResource);
            }).catch(function (error) {
                return callback(error);
            });
        });
    };


    /**
     * TODO:
     * - multipart upload large files (e.g zip) (req.files.uploadFile)
     * - project specific resource (separate folder for each project)
     *
     * @param req
     * @param callback
     */
    this.createResourceFromUpload = function(req, callback) {

        // TODO: get project id from req params, project related resources reside in project folder

        var data = req.body;
        var content = new Buffer(data.data, "base64").toString("utf8");
        var uniqid = require('uniqid');
        var self = this,
            sourceOriginalFilename = data.name,
            hash = uniqid(),
            extension = path.extname(sourceOriginalFilename),
            sourceFilename = 'source-' + hash + extension,
            resourceFilename = 'res-' + hash + '.json';

        var resourceData = {
            source_original_name: sourceOriginalFilename,
            name: sourceOriginalFilename,
            source_filename: __base + 'uploads/' + sourceFilename,
            filename: __base + 'uploads/' + resourceFilename,
            hash: hash
        };

        self.saveFile(resourceData.source_filename, content, function(fileName) {
            // on success create also pipe content file
            var pipeContent = new PipeContent();
            pipeContent.structure.content = data.data;
            self.saveFile(resourceData.filename, JSON.stringify(pipeContent.structure), function(fileName) {
                Resource.build(resourceData).save().then(function(resource) {
                    return callback(null, resource);
                }).catch(function(error) {
                    return callback(error);
                });
            });
        });

    };

    this.saveFile = function(fileName, content, callback) {
        fs.writeFile(fileName, content, function(err) {
            if (err) {
                throw err;
            }
            return callback(fileName);
        });
    };

}

module.exports = new ResourceService();