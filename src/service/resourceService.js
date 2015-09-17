/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_service');
var fs = require('fs');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var path = require('path');
var async = require('async');
var config = require(__base + 'config');
var formidable = require('formidable');
var projectService = require(__base + 'src/service/projectService');
var uniqid = require('uniqid');
var FileUtil = require('../util/fileUtil');
var ObjectUtils = require('../util/objectUtils');

function ResourceService() {

    var self = this;

    this.getResourceInfo = function(req, resourceId, callback) {
        Resource.find(
            {
                where: {
                    id: resourceId
                },
                attributes: ['id','name','pid', 'description','resourceTypeId','originalName', 'createdAt']
            }
        ).then(function(resource) {
            return callback(null, resource);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.getResource = function(req, resourceId, callback) {
        Resource.find({ where: {id: resourceId }}).then(function(resource) {
            return callback(null, resource);
        }).catch(function(error) {

            return callback(error);
        });
    };

    this.updateResource = function(req, resourceId, data, cb) {

        async.waterfall([
            function (callback) {
                self.getResource(req, resourceId, callback);
            },
            function (resource, callback) {
                resource.updateAttributes(data, {fields: ['name','pid','description', 'resourceTypeId']}).then(function () {
                    callback(null, resource);
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], cb);
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

    this.getResourceTypeByValue = function(value, callback) {
        ResourceType.find({ where: {value: value }}).then(function(resourceType) {
            return callback(null, resourceType);
        }).catch(function(error) {
            return callback(error);
        });
    };

    this.getResources = function(req, callback) {
        return resourceDaoService.getResources(req.query, function (err, resources) {
            if(err){
                return callback(err);
            }
            async.mapSeries(resources, function (item, innerCb) {
                async.setImmediate(function () {
                    innerCb(null, ObjectUtils.snakeToCame(item));
                });
            }, callback);
        });
    };

    this.getResourcesPublished = function(req, projectId, callback) {
        var userId = req.redisSession.data.userId;

        return resourceDaoService.findResourcesPublished(projectId, userId, callback);
    };

    this.createResourceFromUpload = function(req, cb) {

        var resourceType;
        var workflow;
        var project;
        var resourceFile;
        var fields;
        var resource;
        var projectLocation;

        async.waterfall(
            [
                function parseForm(callback) {
                    var form = new formidable.IncomingForm();
                    form.parse(req, function(err, fieldsData, files) {
                        if (err) {
                            return callback(err);
                        }

                        resourceFile = files.resourceFile;
                        fields = fieldsData;

                        callback();
                    });
                    form.on('error', function(err) {
                        return cb(err);
                    });
                },
                function checkResourceFile(callback) {
                    if(!resourceFile){
                        return callback('No file attached');
                    }
                    callback();
                },
                function getResourceType( callback ) {
                    ResourceType.find({where: {value: 'text'}}).then(function (type) {
                        if(!type){
                            return callback('Ressursi tüüpi ei leitud.');
                        }
                        resourceType = type;
                        return callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function getProject(callback) {

                    if(fields.workflowId) {
                        Workflow.find({where: {id: fields.workflowId}}).then(function (workflowItem) {
                            workflow = workflowItem;
                            if (!workflow) {
                                return callback('Workflow not found');
                            }
                            workflow.getProject().then(function (projectItem) {
                                project = projectItem;
                                callback();
                            }).catch(function (err) {
                                callback(err.message);
                            });
                        }).catch(function (err) {
                            callback(err.message);
                        });

                    } else if(fields.projectId) {
                        projectService.getProject(req, fields.projectId, function (err, projectItem) {
                            project = projectItem;
                            callback( err );
                        });
                    } else {
                        callback('Project not found');
                    }
                },

                function createResource(callback) {
                    projectLocation = (project != null ? '/project_' + project.id : '');
                    var resourceData = {
                        resourceTypeId: resourceType.id,
                        filename: projectLocation + '/' + uniqid() + path.extname(resourceFile.name),
                        originalName: path.basename(resourceFile.name),
                        name: resourceFile.name
                    };

                    Resource.create(resourceData).then(function (resourceItem) {
                        resource = resourceItem;
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function addResourceToProject(callback) {
                    resource.addProject(project).then(function() {
                        return callback();
                    }).catch(function(err) {
                        return callback(err.message);
                    });
                },
                function checkForWorkflow(callback) {
                    if(workflow){
                        workflow.addInputResource(resource).then(function () {
                            callback()
                        });
                    } else {
                        callback()
                    }
                },
                function renameFile( callback ) {
                    var resourceFileLocation = config.resources.location + projectLocation;
                    if (!fs.existsSync(config.resources.location )) {
                        fs.mkdirSync(config.resources.location);
                    }
                    if (!fs.existsSync(resourceFileLocation)) {
                        fs.mkdirSync(resourceFileLocation);
                    }

                    fs.rename(resourceFile.path, config.resources.location + resource.filename, function(err) {
                        if (err) {
                            logger.error(err);
                            return callback(err);
                        }
                        return callback();
                    });
                }
            ],
            function (err) {
                if(err){
                    logger.error(err);
                    return cb({
                        code: 500,
                        message: err
                    });
                }

                cb(null, resource);
            }
        );
    };

   //todo somehow somewhere
   /*this._loadFromUrl = function (url, targetPath, callback) {

       var request = http.get(url, function(response) {
           if (response.statusCode === 200) {

               var resourceFile = fs.createWriteStream(targetPath);
               response.pipe(resourceFile);
               resourceFile.on('finish', function() {
                   return callback();
               });
               resourceFile.on('error', function(err) {
                   return callback(err);
               });
           } else {
               request.abort();
               return callback('File not found from URL: ' + url);
           }
       });
   };*/

    this.getConcatedResourcePath = function (req, ids, cb) {

        var tmpPath = config.resources.tmp + '/' + ids.replace(',','_');
        async.eachSeries(ids.split(','),
            function iterator(id, callback) {
                self.getResource(req, id, function (err, resource) {
                    if(!resource){
                        return callback('Ressurssi ei leitud');
                    }
                    var resourcePath = config.resources.location + '/' + resource.filename;
                    fs.exists(resourcePath, function (excists) {
                       if(excists){
                           FileUtil.concat(resourcePath, tmpPath, function (err) {
                               return callback();
                           });
                       } else {
                           callback('Faili ei leitud');
                       }
                    });
                });
            },
            function done(err) {
                if(err){
                    logger.error(err);
                }
                cb(err, tmpPath);
            });
    };

    this.deleteResource = function (req, resourceId, options, callback) {

        async.waterfall(
            [
                function getResource(callback) {
                    resourceDaoService.getResource(resourceId, function (err, resource) {
                        if(err){
                            return callback( err );
                        }
                        callback(null, resource);
                    });
                },
                function deleteFile(resource, callback) {
                    fs.unlink(config.resources.location + resource.filename, function (err) {
                        callback(err, resource);
                    });
                },
                function deleteResource(resource, callback) {
                    resource.destroy().then(function () {
                        callback()
                    }).catch(function (err) {
                        return callback( err.message );
                    });
                }
            ],
            function (err) {
                callback( err );
            }
        );
    };

    this.getDownloadName = function ( resource ) {

        if(path.extname(resource.name)){
            return resource.name;
        }
        if(path.extname(resource.originalName)){
            return resource.name + path.extname(resource.originalName);
        }
        if(path.extname(resource.filename)){
            return resource.name + path.extname(resource.filename);
        }
        return resource.name + '.txt';
    };
}

module.exports = new ResourceService();