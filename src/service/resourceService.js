/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_service');
var fs = require('fs');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var Project = require(__base + 'src/service/dao/sql').Project;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;

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

        var query = req.query;

        async.waterfall([
            function setQueryUserId(callback) {
                if (query.workflowId) {
                    Workflow.findById(query.workflowId).then(function (workflow) {
                        if(!workflow){
                            return callback('Töövoogu ei leitud');
                        }
                        query.userId = workflow.userId;
                        callback(null, query);
                    });
                } else {
                    query.userId = req.redisSession.data.userId;
                    callback(null, query);
                }
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

        var resourceType;
        var workflow;
        var project;
        var resourceFile;
        var fields;
        var filename;
        var resource;
        var projectLocation;

        async.waterfall(
            [
                function parseForm(callback) {
                    var form = new formidable.IncomingForm();
                    form.parse(req, function (err, fieldsData, files) {
                        if (err) {
                            return callback(err);
                        }

                        resourceFile = files.resourceFile;
                        fields = fieldsData;

                        callback();
                    });
                    form.on('error', function (err) {
                        return cb(err);
                    });
                },
                function checkResourceFile(callback) {
                    if (!resourceFile) {
                        return callback('No file attached');
                    }
                    callback();
                },
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
                    logger.debug('Got fields: ', fields);

                    if (fields.workflowId) {
                        Workflow.findById(fields.workflowId).then(function (workflowItem) {
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

                    } else if (fields.projectId) {
                        Project.findById(fields.projectId).then(function (projectItem) {
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
                    filename = projectLocation + '/' + uniqid() + path.extname(resourceFile.name);
                    if (!fs.existsSync(config.resources.location)) {
                        fs.mkdirSync(config.resources.location);
                    }
                    if (!fs.existsSync(resourceFileLocation)) {
                        fs.mkdirSync(resourceFileLocation);
                    }

                    fs.rename(resourceFile.path, config.resources.location + filename, function (err) {
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

                    ResourceAssociation.create( associationData ).then(function ( inputAssociation ) {
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });

                }],
            function (err) {
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
                    association.destroy().then(function () {
                        callback(null, resource);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function (resource, callback) {
                    resource.getAssociations().then(function (associations) {
                        if(associations.length == 0){
                            self._deleteResourceEntity(resource, callback);
                        } else {
                            callback();
                        }
                    }).catch(function (err) {
                        callback(err.message);
                    });
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
    };

    this.createResourceFromEntu = function (req, projectId, workflowId, fileId, cb) {

            var resourceType;
            var workflow;
            var project;
            var fields;
            var filename;
            var resource;
            var projectLocation;

            async.waterfall(
                [
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
                        if (workflowId) {
                            Workflow.findById(workflowId).then(function (workflowItem) {
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

                        } else if ( projectId ) {
                            Project.findById( projectId ).then(function (projectItem) {
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
                        //filename = projectLocation + '/' + uniqid() + path.extname(resourceFile.name);
                        filename = projectLocation + '/' + uniqid() + '.' + fileId;

                        if (!fs.existsSync(config.resources.location)) {
                            fs.mkdirSync(config.resources.location);
                        }
                        if (!fs.existsSync(resourceFileLocation)) {
                            fs.mkdirSync(resourceFileLocation);
                        }

                        var entuMeta = {
                            userId: req.redisSession.data.entuUserId,
                            sessionKey: req.redisSession.data.entuSessionKey
                        };

                        entuDaoService.downloadFile( fileId, config.resources.location + filename, entuMeta, function ( err, name ) {
                            return callback(err, name);
                        });
                    },
                    function createResource(name, callback) {
                        var resourceData = {
                            resourceTypeId: resourceType.id,
                            filename: filename,
                            originalName: name,
                            name: name
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

                        ResourceAssociation.create( associationData ).then(function ( inputAssociation ) {
                            callback();
                        }).catch(function (err) {
                            callback(err.message);
                        });
                    }],
                function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    cb(err, resource);
                }
            );
        };
}

module.exports = new ResourceService();