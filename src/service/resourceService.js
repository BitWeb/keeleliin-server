/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_service');
var fs = require('fs');
var resourceDaoService = require('./dao/resourceDaoService');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var Project = require(__base + 'src/service/dao/sql').Project;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var ResourceUser = require(__base + 'src/service/dao/sql').ResourceUser;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var path = require('path');
var async = require('async');
var config = require(__base + 'config');
var formidable = require('formidable');
var projectService = require(__base + 'src/service/projectService');
var uniqid = require('uniqid');
var FileUtil = require('../util/fileUtil');
var ObjectUtils = require('../util/objectUtils');
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

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

                    if (fields.workflowId) {
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

                    } else if (fields.projectId) {
                        projectService.getProject(req, fields.projectId, function (err, projectItem) {
                            project = projectItem;
                            callback(err);
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
                        name: resourceFile.name,
                        userId: req.redisSession.data.userId
                    };

                    Resource.create(resourceData).then(function (resourceItem) {
                        resource = resourceItem;
                        callback();
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function addResourceToProject(callback) {
                    resource.addProject(project).then(function () {
                        return callback();
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                },
                function checkForWorkflow(callback) {
                    if (workflow) {
                        workflow.addInputResource(resource).then(function () {
                            callback()
                        });
                    } else {
                        callback()
                    }
                }
            ],
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

    this.deleteResource = function (req, resourceId, options, callback) {
        /* var options = { context: 'middle_input', projectId: 1, serviceId: 1, workflowId: 1, }; */
        logger.debug(options);

        async.waterfall(
            [
                function getResource(callback) {
                    resourceDaoService.getResource(resourceId, function (err, resource) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, resource);
                    });
                },
                function (resource, callback) {
                    self._deleteResourceFromContext(req, resource, options, callback);
                },
                function getResourceProjects(resource, callback) {
                    resource.getProjects().then(function (projects) {

                        if(projects.length == 0){
                            self._deleteResourceEntity(resource, function (err) {
                                callback( err );
                            });
                        } else {
                            return callback();
                        }
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                }
            ],
            function (err) {
                if (err) {
                    logger.error(err);
                }
                callback(err);
            }
        );
    };

    self._deleteResourceEntity = function( resource, cb ) {
        async.waterfall([
                function (callback) {
                    fs.unlink(config.resources.location + resource.filename, function (err) {
                        if(err && err.code == 'ENOENT'){
                            return callback(null, resource);
                        }
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
                cb( err );
            }
        );
    };

    this._deleteResourceFromContext = function (req, resource, options, callback) {

        if (options.context == 'public') {
            return self.removeResourceFromPublic(req, resource, options, callback);
        } else if (options.context == 'shared') {
            return self.removeResourceFromShared(req, resource, options, callback);
        } else if (options.context == 'project') {
            return self.removeResourceFromProject(req, resource, options, callback);
        } else if (options.context == 'input') {
            return self.removeRemoveResourceFromWorkflowInput(req, resource, options, callback);
        } else if (options.context == 'output') {
            return self.removeRemoveResourceFromWorkflowOutput(req, resource, options, callback);
        } else if (options.context == 'middle_input') {
            return self.removeRemoveResourceFromMiddleInput(req, resource, options, callback);
        } else if (options.context == 'middle_output') {
            return self.removeRemoveResourceFromMiddleOutput(req, resource, options, callback);
        } else {
            callback('Konteksti ei leitud');
        }
    };

    self.removeResourceFromPublic = function (req, resource, options, callback) {
        var userId = req.redisSession.data.userId;
        if (resource.userId != userId) {
            return callback('Avalikku faili saab kustutada vaid selle looja.');
        }
        resource.isPublic = false;
        resource.save().then(function () {
            return callback(null, resource);
        }).catch(function (err) {
            return callback(err.message);
        });
    };

    self.removeResourceFromShared = function (req, resource, options, callback) {
        var userId = req.redisSession.data.userId;
        ResourceUser.find({
            where: {
                resourceId: resource.id,
                userId: userId
            }
        }).then(function (resourceUser) {
            if (resourceUser) {
                resourceUser.destroy().then(function () {
                    callback(null, resource);
                }).catch(function (err) {
                    return callback(err.message);
                });
            } else {
                callback('Ei leitud, et antud ressurss oleks kasutajale jagatud');
            }
        }).catch(function (err) {
            return callback(err.message);
        });
    };

    self.removeResourceFromProject = function (req, resource, options, callback) {
        //todo: siin ei tohiks ressurss olla selle projekti töövoo sisend ega selle projekti töövoo alamsammu sisend
        Project.findById(options.projectId).then(function (project) {
            resource.removeProject(project).then(function () {
                return callback(null, resource);
            }).catch(function (err) {
                return callback(err.message);
            });
        }).catch(function (err) {
            return callback(err.message);
        });
    };

    self.removeRemoveResourceFromWorkflowInput = function (req, resource, options, cb) {
        async.waterfall([
                function getWorkflow(callback) {
                    Workflow.findById(options.workflowId).then(function (workflow) {
                        if (!workflow) {
                            return callback('Töövoogu ei letud.');
                        }
                        callback(null, workflow);
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                },
                function removeFromWorkflowInput(workflow, callback) {
                    workflow.removeInputResource(resource).then(function () {
                        callback(null, resource);
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                }
            ],
            function (err, resource) {
                cb(err, resource);
            }
        );
    };

    self.removeRemoveResourceFromWorkflowOutput = function (req, resource, options, cb) {
        async.waterfall([
                function getWorkflow(callback) {
                    Workflow.findById(options.workflowId).then(function (workflow) {
                        if (!workflow) {
                            return callback('Töövoogu ei letud.');
                        }
                        callback(null, workflow);
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                },
                function (workflow, callback) {
                    var unsetWorkflowOutputIdQuery = 'UPDATE resource SET workflow_output_id = NULL WHERE id = ' + resource.id + '';
                    sequelize.query( unsetWorkflowOutputIdQuery, { type: sequelize.QueryTypes.UPDATE}).then(function () {
                        resource.reload().then(function () {
                            return callback(null, resource);
                        }).catch(function (err) {
                            logger.error(err.message);
                            return callback(err.message);
                        });
                    }).catch(function (err) {
                        logger.error(err.message);
                        return callback(err.message);
                    });
                }
            ],
            function (err, resource) {
                cb(err, resource);
            }
        );
    };

    self.removeRemoveResourceFromMiddleInput = function (req, resource, options, cb) {
        async.waterfall([
            function (callback) {
                WorkflowServiceSubstep.findAll({
                        where: {
                            workflowServiceId: options.serviceId
                        },
                        include: [
                            {
                                model: Resource,
                                as: 'inputResources',
                                attributes: ['id'],
                                where: {
                                    id: resource.id
                                },
                                required: true
                            }
                        ]
                    }
                ).then(function (substeps) {
                        return callback(null, substeps);
                    }).catch(function (err) {
                        return callback(err.message);
                    });
            },
            function (substeps, callback) {
                async.each(substeps, function (substep, innerCb) {
                    substep.removeInputResource(resource).then(function () {
                        innerCb();
                    }).catch(function (err) {
                        return callback(err.message);
                    });
                }, function () {
                    callback();
                });
            }
        ], function (err) {
            cb(err, resource);
        });
    };

    self.removeRemoveResourceFromMiddleOutput = function (req, resource, options, callback) {

        var unsetWorkflowServiceSubstepIdQuery = 'UPDATE resource SET workflow_service_substep_id = NULL WHERE id = ' + resource.id + '';
        sequelize.query( unsetWorkflowServiceSubstepIdQuery, { type: sequelize.QueryTypes.UPDATE}).then(function () {
            resource.reload().then(function () {
                return callback(null, resource);
            }).catch(function (err) {
                logger.error(err.message);
                return callback(err.message);
            });
        }).catch(function (err) {
            logger.error(err.message);
            return callback(err.message);
        });
    };
}

module.exports = new ResourceService();