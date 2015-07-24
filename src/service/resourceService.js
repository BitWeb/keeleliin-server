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
var uniqid = require('uniqid');
var tar = require('tar');
var zlib = require('zlib');
var unzip = require('unzip');
var mkdirp = require('mkdirp'); // used to create directory tree


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

    this.createResourceFromUrl = function(req, resourceData, url, cb) {
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
                    fileName = hash + path.extname(url),
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
                            return callback(null, project, resourceType, filePath, fileName);
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

            function(project, resourceType, filePath, fileName, callback) {
                self._createResourceInstance(req, {
                    filename: filePath,
                    file_type: Resource.fileTypes.FILE,
                    resource_type_id: resourceType.id,
                    source_original_name: fileName,
                    source_filename: fileName,
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

    this._createResourceInstance = function(req, resourceData, cb) {
        Resource.create(resourceData).then(function(resource) {
            return cb(null, resource);
        }).catch(function(error) {
            return cb(error.message);
        });
    };

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

                return self.createResourceFromUrl(req, resourceData, fields.url, cb);
            }

            return self.createResourceFromUpload(req, resourceData, files.resourceFile, cb);
        });

        form.on('error', function(err) {

            return cb(err);
        });
    };

    this.createResourceFromUpload = function(req, resourceData, resourceFile, cb) {

        async.waterfall([
            // Get project
            function(callback) {
                projectService.getProject(req, resourceData.projectId, function(err, project) {
                    return callback(null, project);
                });
            },

            // Get resource type
            function(project, callback) {
                self.getResourceType(req, resourceData.resource_type_id, function(err, rType) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, project, rType);
                });
            },

            // Rename files
            function(project, resourceType, callback) {
                if (resourceFile) {

                    var hash = uniqid(),
                        filename = hash + path.extname(resourceFile.name),
                        projectLocation = (project != null ? '/' + project.id : ''),
                        resourceFileLocation = config.resources.location + projectLocation;

                    if (!fs.existsSync(config.resources.location )) {
                        fs.mkdirSync(config.resources.location);
                    }

                    if (!fs.existsSync(resourceFileLocation)) {
                        fs.mkdirSync(resourceFileLocation);
                    }

                    fs.rename(resourceFile.path, resourceFileLocation + '/' + filename, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, project, resourceType, resourceFileLocation, filename);
                    });
                } else {
                    return callback('No file attached.');
                }
            },

            // Create resource
            function(project, resourceType, filePath, fileName, callback) {
                self._createResourceInstance(req, {
                    resource_type_id: resourceType.id,
                    file_type: resourceData.file_type,
                    name: resourceData.name,
                    filename: filePath + '/' + fileName,
                    source_original_name: fileName,
                    source_filename: fileName
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

    /**
     * Different methods for *.tar.gz and *.zip.
     */
    this.extractArchiveFile = function(location, destination, cb) {

        fs.createReadStream(location)
            .on('error', function(err) {
                return cb(err);
            })
            //.pipe(zlib.Unzip())
            //.pipe(tar.Parse())
            .pipe(unzip.Parse())
            .on('entry', function(entry) {
                var isFile = ('File' == entry.type);
                var fullpath = path.join(destination, entry.path);
                var directory = (isFile ? path.dirname(fullpath) : fullpath);

                mkdirp(directory, function(err) {
                    if (err) {
                        return cb(err);
                    }

                    if (isFile) {
                        entry.pipe(fs.createWriteStream(fullpath));
                    }
                });
            })
            .on('close', function() {
                return cb();
            });

    };


}

module.exports = new ResourceService();