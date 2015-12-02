/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_service');
var fs = require('fs');
var request = require('request');
request.debug = true;
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var Project = require(__base + 'src/service/dao/sql').Project;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var User = require(__base + 'src/service/dao/sql').User;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var path = require('path');
var async = require('async');
var config = require(__base + 'config');
var formidable = require('formidable');
var uniqid = require('uniqid');
var FileUtil = require('../util/fileUtil');
var ObjectUtils = require('../util/objectUtils');
var sequelize = require(__base + 'src/service/dao/sql').sequelize;
var entuDaoService = require('./dao/entu/daoService');

function ResourceService() {

    var self = this;

    this.getResourceInfo = function (req, resourceId, callback) {
        Resource.find(
            {
                where: {
                    id: resourceId
                },
                attributes: ['id', 'name', 'pid', 'description', 'resourceTypeId', 'originalName', 'createdAt', 'fileSize']
            }
        ).then(function (resource) {
                return callback(null, resource);
            }).catch(function (error) {

                return callback(error);
            });
    };

    this.getResource = function (req, resourceId, callback) {
        Resource.find({where: {id: resourceId}}).then(function (resource) {
            return callback(null, resource);
        }).catch(function (error) {

            return callback(error);
        });
    };

    this.updateResource = function (req, resourceId, data, cb) {

        async.waterfall([
            function (callback) {
                self.getResource(req, resourceId, callback);
            },
            function (resource, callback) {
                resource.updateAttributes(data, {fields: ['name', 'pid', 'description', 'resourceTypeId']}).then(function () {
                    callback(null, resource);
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], cb);
    };

    this.getResourceType = function (req, resourceTypeId, callback) {
        ResourceType.find({where: {id: resourceTypeId}}).then(function (resourceType) {
            if (!resourceType) {

                return callback('No resource type found with id: ' + resourceTypeId);
            }

            return callback(null, resourceType);

        }).catch(function (error) {

            return callback(error);
        });
    };

    this.getResourceTypeByValue = function (value, callback) {
        ResourceType.find({where: {value: value}}).then(function (resourceType) {
            return callback(null, resourceType);
        }).catch(function (error) {
            return callback(error);
        });
    };

    this.getResources = function (req, cb) {

        async.waterfall([
            function setQueryParams(callback) {

                var query = req.query;
                var params = {};

                if (query.workflowId) {
                    params.workflowId = query.workflowId;
                } else if(query.projectId) {
                    params.projectId = query.projectId;
                } else if(query.userId){
                    params.userId = query.userId;
                } else {
                    params.userId = req.redisSession.data.userId;
                }

                callback(null, params);
            },
            function queryData(query, callback) {
                return resourceDaoService.getResources(query, function (err, resources) {
                    return callback(err, resources);
                });
            },
            function mapData(resources, callback) {
                async.mapSeries(resources, function (item, innerCb) {
                    async.setImmediate(function () {
                        innerCb(null, ObjectUtils.snakeToCame(item));
                    });
                }, callback);
            }
        ], function (err, data) {
            cb(err, data);
        });
    };

    this.createResourceFromUpload = function (req, cb) {

        async.waterfall(
            [
                function parseForm(callback) {
                    var form = new formidable.IncomingForm();
                    form.uploadDir = config.resources.tmp;

                    form.parse(req, function (err, fieldsData, files) {
                        if (err) {
                            return callback(err);
                        }

                        var resourceFile = files.resourceFile;

                        if (!resourceFile) {
                            return callback('No file attached');
                        }

                        var tmpFIle = {
                            projectId: fieldsData.projectId,
                            workflowId: fieldsData.workflowId,
                            path: resourceFile.path,
                            name: resourceFile.name
                        };

                        callback(null, tmpFIle);
                    });
                    form.on('error', function (err) {
                        return callback(err);
                    });
                },
                function checkResourceFile( tmpFIle, callback) {
                    self.createResource(req, tmpFIle, callback);
                }
            ],
            function (err, resource) {
                if (err) {
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

    this.createResourceFromUrl = function (req, data, cb) {

        async.waterfall([
                function ( callback ) {

                    var tmpPath = config.resources.tmp + '/' + uniqid();
                    var tmpFIle = {
                        projectId: data.projectId,
                        workflowId: data.workflowId,
                        path: tmpPath,
                        name: data.name
                    };

                    var r = request({ method  : 'GET', uri : data.url });
                    r.on("response", function (res) {
                        if (res.statusCode === 200) {
                            var resourceFile = fs.createWriteStream( tmpPath );
                            res.pipe(resourceFile);
                            resourceFile.on('finish', function() {
                                callback(null, tmpFIle);
                            });
                            resourceFile.on('error', function(err) {
                                logger.error('GOT ERROR: ', + err);
                                return callback(err);
                            });
                        } else {
                            r.abort();
                            logger.error('Faili ei leitud');
                            return callback('Faili ei leitud');
                        }
                    }).on('error', function(e) {
                        logger.debug('problem with request: ' + e);
                        return callback( e );
                    });
                },
                function ( tmpFIle, callback ) {
                    self.createResource(req, tmpFIle, callback);
                }
            ],
            function (err, resource) {
                if (err) {
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

    this.loadEntuFiles = function (req, data, cb) {

        async.eachLimit(data.files, 5, function (fileId, innerCallback) {
            if(!fileId){
                return innerCallback();
            }
            self.createResourceFromEntu(req, data.projectId, data.workflowId, fileId, function (err, resource) {
                innerCallback(err);
            });
        }, function (err) {
            cb(err);
        });
    };

    this.createResourceFromEntu = function (req, projectId, workflowId, fileId, cb) {

        async.waterfall([
                function ( callback ) {

                    var tmpPath = config.resources.tmp + '/' + uniqid();
                    var tmpFIle = {
                        projectId: projectId,
                        workflowId: workflowId,
                        path: tmpPath,
                        name: 'Entu fail'
                    };

                    var entuMeta = {
                        userId: req.redisSession.data.entuUserId,
                        sessionKey: req.redisSession.data.entuSessionKey
                    };

                    entuDaoService.downloadFile( fileId, tmpPath, entuMeta, function ( err, name ) {
                        tmpFIle.name = name;
                        return callback(err, tmpFIle);
                    });
                },
                function ( tmpFIle, callback ) {
                    self.createResource(req, tmpFIle, callback);
                }
            ],
            function (err, resource) {
                if (err) {
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


    this.createResource = function (req, tmpfile, cb) {

        // tmpfile.name;
        // tmpfile.path; //tmpPath
        // tmpfile.projectId;
        // tmpfile.workflowId;

        var resourceType;
        var workflow;
        var project;
        var filename;
        var resource;
        var projectLocation;

        async.waterfall([
            function getResourceType(callback) {
                ResourceType.find({where: {value: 'text'}}).then(function (type) {
                    if (!type) {
                        return callback('Ressursi tüüpi ei leitud.');
                    }
                    resourceType = type;
                    return callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function getProject(callback) {

                if (tmpfile.workflowId) {
                    Workflow.findById(tmpfile.workflowId).then(function (workflowItem) {
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

                } else if (tmpfile.projectId) {
                    Project.findById(tmpfile.projectId).then(function (projectItem) {
                        project = projectItem;
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                } else {
                    callback('Project not found');
                }
            },

            function renameFile(callback) {
                projectLocation = (project != null ? '/project_' + project.id : '');
                var resourceFileLocation = config.resources.location + projectLocation;
                filename = projectLocation + '/' + uniqid() + path.extname(tmpfile.name);
                if (!fs.existsSync(config.resources.location)) {
                    fs.mkdirSync(config.resources.location);
                }
                if (!fs.existsSync(resourceFileLocation)) {
                    fs.mkdirSync(resourceFileLocation);
                }

                FileUtil.mv(tmpfile.path, config.resources.location + filename, function (err) {
                    if (err) {
                        logger.error(err);
                        return callback(err);
                    }
                    return callback();
                });
            },
            function createResource(callback) {

                var resourceData = {
                    resourceTypeId: resourceType.id,
                    filename: filename,
                    originalName: path.basename(tmpfile.name),
                    name: tmpfile.name
                };

                Resource.create(resourceData).then(function (resourceItem) {
                    resource = resourceItem;
                    callback();
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function createAssociations(callback) {

                var associationData = {
                    resourceId: resource.id,
                    userId: req.redisSession.data.userId,
                    projectId: project.id
                };

                if(workflow){
                    associationData.context = ResourceAssociation.contexts.WORKFLOW_INPUT;
                    associationData.workflowId = workflow.id;
                } else {
                    associationData.context = ResourceAssociation.contexts.PROJECT_FILE;
                }

                self.createAssociation(associationData, callback);
            }
        ], function (err) {
                cb(err, resource);
        });
    };


    this.getConcatedResourcePath = function (req, ids, cb) {

        var tmpPath = config.resources.tmp + '/' + ids.replace(',', '_');
        async.eachSeries(ids.split(','),
            function iterator(id, callback) {
                self.getResource(req, id, function (err, resource) {
                    if (!resource) {
                        return callback('Ressurssi ei leitud');
                    }
                    var resourcePath = config.resources.location + '/' + resource.filename;
                    fs.exists(resourcePath, function (excists) {
                        if (excists) {
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
                if (err) {
                    logger.error(err);
                }
                cb(err, tmpPath);
            });
    };

    this.getDownloadName = function (resource) {
        if (path.extname(resource.name)) {
            return resource.name;
        }
        if (path.extname(resource.originalName)) {
            return resource.name + path.extname(resource.originalName);
        }
        if (path.extname(resource.filename)) {
            return resource.name + path.extname(resource.filename);
        }
        return resource.name + '.txt';
    };

//######################################################################################################################

    this.deleteResourceAssociation = function (req, associationId, cb) {

        async.waterfall([
                function (callback) {
                    ResourceAssociation.findById( associationId)
                        .then(function (association) {
                            callback( null, association);
                        })
                        .catch(function (err) {
                            callback(err.message);
                        });
                },
                function (association, callback) {
                    self.deleteAssociation( association, callback );
                }
            ],
            function (err) {
                if(err){
                    logger.error( err );
                }
                cb(err);
            }
        );
    };


    this.deleteAssociation = function (association, cb) {

        async.waterfall([
                function ( callback ) {
                    association.getResource()
                        .then(function (resource) {
                            if(!resource){
                                callback('Seose ressurss on juba kustutatud');
                            }
                            callback(null, association, resource);
                        })
                        .catch(function (err) {
                            callback(err.message);
                        });
                },
                function (association, resource, callback) {
                    self.destroyAssociation(association, function (err) {
                        callback(err, resource);
                    });
                },
                function (resource, callback) {
                    self._deleteResourceEntity(resource, callback);
                }
            ],
            function (err) {
                if(err){
                    logger.error( err );
                }
                cb(err);
            }
        );
    };

    self._deleteResourceEntity = function( resource, cb ) {

        resource.getAssociations().then(function (associations) {
            if(associations.length == 0){

                async.waterfall([
                        function (callback) {
                            logger.debug('Unlink file');
                            fs.unlink(config.resources.location + resource.filename, function (err) {
                                if(err && err.code == 'ENOENT'){
                                    return callback(null, resource);
                                }
                                callback(err, resource);
                            });
                        },
                        function deleteResource(resource, callback) {
                            logger.debug('Delete resource entity');
                            resource.destroy().then(function () {
                                callback()
                            }).catch(function (err) {
                                return callback( err.message );
                            });
                        }
                    ],
                    function (err) {
                        cb( err );
                    }
                );

            } else {
                cb();
            }
        }).catch(function (err) {
            cb(err.message);
        });

    };

    this.addInputAssociations = function (req, data, cb) {

        logger.trace('Add resources', data);

        var workflow;
        var project;

        async.waterfall([

            function getProject(callback) {

                if (data.workflowId) {
                    Workflow.findById(data.workflowId).then(function (workflowItem) {
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

                } else if (data.projectId) {
                    Project.findById(data.projectId).then(function (projectItem) {
                        project = projectItem;
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                } else {
                    callback('Project not found');
                }
            },

            function ( callback ) {
                async.eachLimit(data.resourceIds, 5, function (resourceId, innerCallback) {
                    if(!resourceId){
                        return innerCallback();
                    }
                    resourceDaoService.getResource(resourceId, function (err, resource) {
                        if(err){
                            logger.error(err);
                            return innerCallback();
                        }

                        var associationData = {
                            resourceId: resource.id,
                            userId: req.redisSession.data.userId
                        };

                        if(workflow){
                            associationData.context = ResourceAssociation.contexts.WORKFLOW_INPUT;
                            associationData.workflowId = workflow.id;
                            associationData.projectId = project.id;
                        } else {
                            associationData.context = ResourceAssociation.contexts.PROJECT_FILE;
                            associationData.projectId = project.id;
                        }

                        self.createAssociation(associationData, innerCallback);
                    });
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            cb(err);
        })
    };

    this.createAssociation = function(data, cb) {

        async.waterfall([
                function countUserResourceAssociations(callback) {
                    ResourceAssociation.count({where: {
                        resourceId: data.resourceId,
                        userId: data.userId
                    }}).then(function (count) {
                        callback(null, count);
                    });
                },
                function (count, callback) {

                    logger.debug('User had ' + count + ' associations');

                    if(count == 0){
                        logger.debug('New resource association');

                        Resource.findById(data.resourceId).then(function (resource) {
                            User.findById(data.userId).then(function (user) {

                                logger.debug('User disc size ' + user.discCurrent + ' resource size:' + resource.fileSize);

                                if( ( user.discCurrent + resource.fileSize ) > user.discMax ){
                                    self._deleteResourceEntity(resource, function (err) {
                                        return callback('Resurssi ei saa lisada. Kasutaja kettaruum on täis.');
                                    });
                                } else {
                                    user.increment({ discCurrent: resource.fileSize}).then(function () {
                                        user.reload().then(function () {
                                            if( user.discCurrent  > user.discMax ) {
                                                user.decrement({ discCurrent: resource.fileSize}).then(function () {
                                                    return callback('Resurssi ei saa lisada. Kasutaja kettaruum on täis.');
                                                });
                                            } else {
                                                return callback();
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    ResourceAssociation.create( data ).then(function (association) {
                        callback(null, association);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                }
            ],
            function (err, association) {
                if(err){
                   logger.error(err);
                }

                logger.debug('association created');

                cb(err, association);
            }
        );
    };


    this.destroyAssociation = function (association, cb) {

        var user;
        var resource;
        async.waterfall([
                function (callback) {
                    association.getUser().then(function (userItem) {
                        user = userItem;
                        callback();
                    });
                },
                function (callback) {
                    association.getResource().then(function (resourceItem) {
                        resource = resourceItem;
                        callback();
                    });
                },
                function (callback) {
                    association.destroy().then(function () {
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function (callback) {
                    ResourceAssociation.count({where: {
                        resourceId: resource.id,
                        userId: user.id
                    }}).then(function (count) {
                        callback(null, count);
                    });
                },
                function (count, callback) {
                    if(count == 0){
                        user.decrement({ discCurrent: resource.fileSize }).then(function () {
                            user.reload().then(function () {
                                if(user.discCurrent < 0){
                                    logger.error('Kasutaja ' +  user.id + ' kettakasutus läks negatiivseks.');
                                    user.discCurrent = 0;
                                    user.save().then(function () {
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            });
                        });
                    } else {
                        callback();
                    }
                }
            ],
            function (err) {
                cb(err);
            }
        );
    };
}

module.exports = new ResourceService();