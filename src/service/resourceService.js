/**
 * Created by taivo on 11.06.15.
 */

var fs = require('fs');
var urlHelper = require('url');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var path = require('path');
var async = require('async');
var http = require('http');
var config = require(__base + 'config');
var formidable = require('formidable');
var projectService = require(__base + 'src/service/projectService');
var uniqid = require('uniqid');


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

    //todo: Not used?
/*    this.saveResource = function(req, resourceId, resourceData, callback) {

        resourceDaoService.getResource(resourceId, function (err, resource) {
            if (err) {
                return callback(err);
            }
            resource.updateAttributes(resourceData).then(function (updatedResource) {
                return callback(null, updatedResource);
            }).catch(function (error) {
                return callback(error);
            });
        });
    };*/

    this.createResource = function(req, cb) {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            if (err) {
                return cb(err);
            }

            var resourceData = {
                projectId: req.params.projectId,
                resource_type_id: fields.resource_type_id,
                file_type: fields.file_type,
                name: fields.name
            };

            if (fields.url && fields.url != '') {

                return self._createResourceFromUrl(req, resourceData, fields.url, cb);
            }

            return self._createResourceFromUpload(req, resourceData, files.resource_file, cb);
        });

        form.on('error', function(err) {

            return cb(err);
        });
    };

    this._createResourceFromUrl = function(req, resourceData, url, cb) {
        async.waterfall([
            function(callback) {
                projectService.getProject(req, resourceData.projectId, function(err, project) {
                    return callback(null, project);
                });
            },

            function(project, callback) {
                self.getResourceType(req, resourceData.resource_type_id, function(err, resourceType) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, project, resourceType);
                });
            },

            function(project, resourceType, callback) {
                var projectLocation = (project != null ? '/' + project.id : ''),
                    hash = uniqid(),
                    parsedUrl = urlHelper.parse(url),
                    fileName = hash + path.extname(url),
                    originalFileName = path.basename(parsedUrl.pathname),
                    resourceFileLocation = config.resources.location + projectLocation;

                if (!fs.existsSync(config.resources.location)) {
                    fs.mkdirSync(config.resources.location);
                }

                if (!fs.existsSync(resourceFileLocation)) {
                    fs.mkdirSync(resourceFileLocation);
                }

                var filePath = resourceFileLocation + '/' + fileName;

                var request = http.get(url, function(response) {
                    if (response.statusCode === 200) {

                        var resourceFile = fs.createWriteStream(filePath);
                        response.pipe(resourceFile);

                        resourceFile.on('finish', function() {
                            return callback(null, project, resourceType, (projectLocation + '/' + fileName), fileName, originalFileName);
                        });

                        resourceFile.on('error', function(err) {
                            return callback(err);
                        });
                    } else {
                        request.abort();
                        return callback('File not found from URL: ' + url);
                    }
                });
            },

            function(project, resourceType, filePath, fileName, originalFileName, callback) {
                self._createResourceInstance(req, {
                    filename: filePath,
                    file_type: Resource.fileTypes.FILE,
                    resource_type_id: resourceType.id,
                    original_name: originalFileName,
                    name: fileName
                }, function(err, resource) {
                    if (err) {
                        return callback(err);
                    }

                    if (project != null) {
                        resource.addProject(project).then(function() {
                            return callback(null, resource);
                        }).catch(function(error) {
                            return callback(error);
                        });
                    }

                    return callback(null, resource);
                });

            }
        ], cb);
    };


    this._createResourceFromUpload = function(req, resourceData, resourceFile, cb) {

        async.waterfall([
            function getProject(callback) {
                projectService.getProject(req, resourceData.projectId, function(err, project) {
                    return callback(null, project);
                });
            },
            function getResourceType(project, callback) {
                self.getResourceType(req, resourceData.resource_type_id, function(err, rType) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, project, rType);
                });
            },
            function renameFiles(project, resourceType, callback) {
                if (resourceFile) {

                    var hash = uniqid(),
                        fileName = hash + path.extname(resourceFile.name),
                        originalFileName = path.basename(resourceFile.name),
                        projectLocation = (project != null ? '/' + project.id : ''),
                        resourceFileLocation = config.resources.location + projectLocation;

                    if (!fs.existsSync(config.resources.location )) {
                        fs.mkdirSync(config.resources.location);
                    }

                    if (!fs.existsSync(resourceFileLocation)) {
                        fs.mkdirSync(resourceFileLocation);
                    }

                    fs.rename(resourceFile.path, resourceFileLocation + '/' + fileName, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, project, resourceType, (projectLocation + '/' + fileName), fileName, originalFileName);
                    });
                } else {
                    return callback('No file attached.');
                }
            },

            // Create resource
            function(project, resourceType, filePath, fileName, originalFileName, callback) {
                self._createResourceInstance(req, {
                    resource_type_id: resourceType.id,
                    file_type: resourceData.file_type,
                    filename: filePath,
                    original_name: originalFileName,
                    name: resourceData.name
                }, function(err, resource) {
                    if (err) {
                        return callback(err);
                    }

                    if (project != null) {
                        resource.addProject(project).then(function() {
                            return callback(null, resource);
                        }).catch(function(error) {
                            return callback(error);
                        });
                    }

                    return callback(null, resource);
                });

            }
        ], function(err, resource) {
            if (err) {
                return cb(err);
            }

            return cb(null, resource);
        });
    };

    this._createResourceInstance = function(req, resourceData, cb) {
        Resource.create(resourceData).then(function(resource) {
            return cb(null, resource);
        }).catch(function(error) {
            return cb(error.message);
        });
    };
}

module.exports = new ResourceService();