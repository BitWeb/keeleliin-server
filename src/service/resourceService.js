/**
 * Created by taivo on 11.06.15.
 */

var fs = require('fs');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var path = require('path');
var async = require('async');
var http = require('http');
var config = require(__base + 'config');
var formidable = require('formidable');
var projectService = require(__base + 'src/service/projectService');

function ResourceService() {

    var self = this;

    this.getResource = function(req, resourceId, callback) {

        Resource.find({ where: {id: resourceId }}).then(function(resource) {

            return callback(null, resource);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getResourceType = function(req, resourceTypeId, callback) {
        ResourceType.find({ where: {id: resourceTypeId }}).then(function(resourceType) {
            if (!resourceType) {

                return callback('No resource type found with id: ' + resourceTypeId);
            }

            return callback(null, resourceType);

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
    //
    //this.createResourceFromUrl = function(url, resourceType, extension, cb) {
    //
    //    var uniqid = require('uniqid'),
    //        hash = uniqid();
    //    var resourceFileLocation = config.resources.downloadLocation + hash + extension;
    //    var file = fs.createWriteStream(resourceFileLocation);
    //    var request = http.get(url, function(response) {
    //        response.pipe(file);
    //
    //        file.on('finish', function() {
    //
    //        });
    //
    //        file.on('error', function(err) {
    //            fs.unlink(resourceFileLocation);
    //            return cb(err);
    //        });
    //
    //    });
    //
    //};

    /**
     * TODO:
     * - multipart upload large files (e.g zip) (req.files.uploadFile)
     * - URL ?
     *
     * @param req
     * @param cb
     */
    this.createResourceFromUpload = function(req, cb) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            if (err) {
                return cb(err);
            }

            var resourceData = {
                projectId: req.params.projectId,
                resource_type_id: fields.resource_type_id,
                file_type: fields.file_type,
                name: fields.name,
                resourceFile: files.resourceFile
            };

            return self.createResource(req, resourceData, cb);
        });

        form.on('error', function(err) {

            return cb(err);
        });
    };

    this.createResource = function(req, resourceData, cb) {
        var resourceType,
            resourceFileLocation,
            projectLocation,
            uniqid = require('uniqid'),
            hash = uniqid(),
            filename,
            resourceProject = null;

        async.waterfall([
            // Get project
            function(callback) {
                projectService.getProject(req, resourceData.projectId, function(err, project) {
                    if (project) {
                        resourceProject = project;
                    }
                    return callback();
                });
            },

            // Get resource type
            function(callback) {
                self.getResourceType(req, resourceData.resource_type_id, function(err, rType) {
                    if (err) {
                        return callback(err);
                    }
                    resourceType = rType;
                    callback();
                });
            },
            // Rename files
            function(callback) {
                if (resourceData.resourceFile) {
                    filename = hash + path.extname(resourceData.resourceFile.name);
                    projectLocation = (resourceProject != null ? '/' + resourceProject.id : '');
                    resourceFileLocation = config.resources.location + projectLocation;
                    if (!fs.existsSync(config.resources.location )) {
                        fs.mkdirSync(config.resources.location);
                    }

                    if (!fs.existsSync(resourceFileLocation)) {
                        fs.mkdirSync(resourceFileLocation);
                    }

                    fs.rename(resourceData.resourceFile.path, resourceFileLocation + '/' + filename, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        callback();
                    });
                } else {
                    callback('No file attached.');
                }
            },
            // Create resource
            function(callback) {
                var data = {
                    resource_type_id: resourceType.id,
                    file_type: resourceData.file_type,
                    name: resourceData.name,
                    filename: projectLocation + '/' + filename,
                    source_original_name: resourceData.resourceFile.name,
                    source_filename: '',
                    hash: hash
                };

                var resource = Resource.build(data);
                resource.save().then(function(resource) {
                    if (resourceProject != null) {
                        resource.addProject(resourceProject);
                    }
                    callback(null, resource);
                }).catch(function(err) {
                    callback(err);
                });
            }
        ], function(err, resource) {
            if (err) {
                return cb(err);
            }

            return cb(null, resource);
        });
    }

}

module.exports = new ResourceService();