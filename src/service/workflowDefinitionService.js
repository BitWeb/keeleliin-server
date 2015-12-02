/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_service');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var userDaoService = require('./dao/userDaoService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var User = require(__base + 'src/service/dao/sql').User;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var async = require('async');
var ArrayUtil = require(__base + 'src/util/arrayUtils');
var ObjectUtil = require(__base + 'src/util/objectUtils');
var userService = require('./userService');
var config = require(__base + 'config');


function WorkflowDefinitionService() {

    var self = this;

    this.createNewWorkflow = function (req, data, cb) {

        async.waterfall([
            function getCurrentUser(callback) {
                userService.getCurrentUser(req, callback);
            },
            function getDefinition(user, callback) {
                WorkflowDefinition.findById( data.workflowDefinitionId).then(function (definition) {
                    if(!definition){
                        return callback('Töövoo definitsiooni ei leitud');
                    }
                    callback(null, user, definition);
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function(user, definition, callback){
                var workflowData = {
                    projectId   : data.projectId,
                    workflowDefinitionId: definition.id,
                    userId      : user.id,
                    name        : definition.name,
                    description : definition.description,
                    purpose     : definition.purpose
                };
                Workflow.create(workflowData).then(function (workflow) {
                    callback( null, workflow);
                }).catch(function (err) {
                    callback(err.message);
                });
            }
        ], function (err, workflow) {
            if(err){
               logger.error(err);
            }
            cb(err, workflow);
        });
    };

    this.defineNewWorkflow = function(req, workflowDefinitionData, cb) {

        async.waterfall([
            function getCurrentUser(callback) {
                userService.getCurrentUser(req, callback);
            },
            function createWorkflow(user, callback) {

                workflowDefinitionData.userId = user.id;
                var workflow = Workflow.build(workflowDefinitionData, {fields: ['name', 'description', 'purpose', 'projectId', 'userId', 'accessStatus']});
                workflow.validate().then(function (err) {
                    if (err) {
                        return callback(err.message);
                    }
                    workflow.save().then(function () {
                        callback( null, workflow);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                });
            },

            function createDefinition(workflow, callback) {
                workflowDefinitionData.workflowId = workflow.id;
                var definition = WorkflowDefinition.build(workflowDefinitionData, {fields: ['name', 'description', 'purpose', 'projectId', 'userId', 'workflowId', 'accessStatus']});

                definition.validate().then(function (err) {
                    if (err) {
                        return callback(err.message);
                    }
                    definition.save().then(function () {
                        callback(null, definition, workflow);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                });
            },
            function (definition, workflow, callback) {
                workflow.updateAttributes({
                    workflowDefinitionId: definition.id
                }).then(function(){
                    callback(null, definition, workflow);
                });
            },
            function (definition, workflow, callback) {
                logger.debug('Add definition owner user: def:' + definition.id + ' user: ' + workflow.userId);

                WorkflowDefinitionUser.create({
                    role: WorkflowDefinitionUser.roles.OWNER,
                    userId: workflow.userId,
                    workflowDefinitionId: definition.id
                }).then(function () {
                    logger.debug('Definition user added');
                    return callback(null, definition, workflow);
                }).catch(function (e) {
                    logger.error(e.pop());
                    return callback('Err: ' + e.message);
                });
            },
            function (definition, workflow, callback) {
                logger.debug('Add shared to users users');
                if(definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED){
                    return self._updateDefinitionUserRelations( req, definition, workflowDefinitionData.users, function (err, definition) {
                        return callback(err, workflow);
                    });
                }
                logger.debug('Not shared definition: ', definition);
                return callback(null, workflow);
            }
        ], function (err, workflow) {
            if(err){
               logger.error('Create error: ', err);
            }
            cb(err, workflow);
        });
    };

    this.getWorkflowSettings = function (req, workflowId, cb) {

        async.waterfall(
            [
                function (callback) {
                    Workflow.find({
                        where: {id: workflowId},
                        attributes:['id','name','description','purpose'],
                        include: [
                            {
                                model: WorkflowDefinition,
                                as: 'workflowDefinition',
                                attributes:['id','accessStatus', 'workflowId']
                            }
                        ]
                    }).then(function (item) {
                        callback(null, item);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function mapData(workflow, callback) {

                    var result = {
                        id: workflow.id,
                        name: workflow.name,
                        description: workflow.description,
                        purpose: workflow.purpose,
                        accessStatus: workflow.workflowDefinition.accessStatus,
                        canEditAccessStatus: workflow.workflowDefinition.workflowId == workflow.id
                    };
                    workflow.workflowDefinition.getWorkflowDefinitionUsers().then(function (relations) {
                        result.users = relations.map(function (item) {
                            return item.id;
                        });
                        callback(null, result);
                    });
                }
            ],
            function (err, data) {
                if(err){
                    logger.error(err);
                }

                cb(err, data);
            }
        );
    };

    this.getWorkflowDefinitionOverview = function (req, definitionId, cb) {

        async.waterfall(
            [
                function (callback) {
                    WorkflowDefinition.find({
                        where: {
                            id: definitionId
                        },
                        attributes:[
                            'id',
                            'name',
                            'description',
                            'purpose',
                            'accessStatus',
                            'createdAt'
                        ],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes:['id','name', 'displaypicture']
                            }
                        ]
                    }).then(function (item) {
                        callback(null, item);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function (item, callback) {
                    if(!item){
                        return callback({
                            code: 404,
                            message: 'Töövoo definitsiooni ei leitud'
                        });
                    }
                    callback(null, item);
                }
            ],
            function (err, data) {
                if(err){
                    logger.error(err);
                }

                cb(err, data);
            }
        );
    };

    this.updateWorkflowSettings = function (req, workflowId, data, cb) {
        async.waterfall([
            function (callback) {

                Workflow.findById( workflowId ).then(function (workflow) {
                    if(!workflow){
                        return callback('Töövoogu ei leitud');
                    }
                    callback(null, workflow);
                }).catch(function (err) {
                    callback(err.message);
                });
            },
            function (workflow, callback) {
                workflow.updateAttributes(data, {fields:['name', 'description', 'purpose']}).then(function () {
                    callback(null, workflow);
                });
            },
            function (workflow, callback) {
                workflow.getWorkflowDefinition().then(function(definition){
                    if(!definition){
                        self.createDefinitionToWorkflow(req, workflow, function (err, definition) {
                            callback(null, workflow, definition);
                        });
                    } else {
                        callback(null, workflow, definition);
                    }
                });
            },
            function updateDefinition(workflow, definition, callback) {
                if(definition.workflowId == workflow.id){
                    var updateFields = ['name', 'description', 'purpose', 'accessStatus'];
                    definition.updateAttributes(data, {fields:updateFields}).then(function () {
                        callback(null, workflow, definition);
                    });
                } else {
                    callback(null, workflow, definition);
                }
            },
            function (workflow, definition, callback) {
                if( definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED ){
                    return self._updateDefinitionUserRelations( req, definition, data.users, function (err, definition) {
                        return callback(null, workflow);
                    });
                }
                return callback(null, workflow);
            }
        ], function (err, workflow) {
            if(err){
                logger.error(err);
            }
            cb(err, workflow);
        });
    };

    /**
     * @param req
     * @param definition
     * @param userIds [userId, userId ...]
     * @param cb
     * @returns {*}
     * @private
     */
    this._updateDefinitionUserRelations = function (req, definition, userIds, cb) {

        logger.debug('Update definition user relations: ', userIds);

        if(!userIds){
            return cb(null, definition);
        }

        var currentUser;

        async.waterfall([
            function getCurrentUser( callback ) {
                userService.getCurrentUser(req, function (err, user) {
                    currentUser = user;
                    callback(err);
                });
            },
            function getRelations( callback ) {
                logger.debug('Get relations');
                definition.getWorkflowDefinitionUserRelations().then(function (existingRelations) {
                    callback(null, existingRelations);
                });
            },
            function isCurrentUserInOwnerRelation(existingRelations, callback) {

                logger.debug('Is current user in owner');
                var currentOwnerRelation = ArrayUtil.find(existingRelations, function (definitionUser) {
                    return definitionUser.role == WorkflowDefinitionUser.roles.OWNER && definitionUser.userId == currentUser.id
                });

                if(currentOwnerRelation){
                    return callback( null, existingRelations);
                }

                logger.info('User is not owner in projectuser relation');
                return cb(null, definition);
            },

            function removeOrUpdateRelations(existingRelations, callback) {
                logger.debug('Remove or update relations', existingRelations.length);

                async.eachOfSeries(existingRelations, function (existingRelation, key, innerCb) {

                    if(existingRelation.userId == currentUser.id) { // do not update current user record
                        logger.trace('Do not update current user record');
                        return innerCb();
                    }

                    var updateRelation = ArrayUtil.find(userIds, function (userId) { return userId == existingRelation.userId; });
                    if(updateRelation){
                        //existingRelation.role = WorkflowDefinitionUser.roles.VIEWER;
                        logger.debug('Update', existingRelation);
                        existingRelation.save().then(function () {
                            innerCb();
                        });
                    } else {
                        logger.debug('Remove', existingRelation);
                        existingRelation.destroy().then(function () {
                            innerCb();
                        });
                    }
                },
                    callback
                );
            },
            function addNewUserRelations( callback ){
                logger.debug('Add new relations');

                definition.getWorkflowDefinitionUserRelations().then(function (existingRelations) {

                    logger.debug('New relations', userIds);

                    async.eachOfSeries( userIds ,
                        function (newRelationUserId, key, innerCb) {

                            logger.debug('New relation', newRelationUserId);

                            var existingRelation = ArrayUtil.find(existingRelations, function (item) {
                                return item.userId == newRelationUserId;
                            });

                            if( existingRelation ){
                                return innerCb();
                            }

                            logger.debug('No relation for: ', newRelationUserId);

                            userDaoService.findById(newRelationUserId, function (err, user) {
                                if(err){
                                    return innerCb(err.message);
                                }

                                WorkflowDefinitionUser.create({
                                    userId: user.id,
                                    workflowDefinitionId: definition.id,
                                    role: WorkflowDefinitionUser.roles.EDITOR
                                }).then(function () {
                                    return innerCb();
                                }).catch(function (e) {
                                    return innerCb('Err' + e.message);
                                });
                            });
                        },
                        function (err) {
                            callback(err);
                        }
                    );
                });
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            cb(err, definition);
        });
    };

    this.updateDefinitionServices = function(req, workflowId, selectedServicesData, cb){
        async.waterfall([
                function getWorkflow(callback) {
                    workflowDaoService.getWorkflow(workflowId, callback);
                },
                function getDefinition(workflow, callback) {
                    workflow.getWorkflowDefinition().then(function (workflowDefinition) {
                        if(!workflowDefinition){
                            return callback('No definition found!');
                        }

                        if(workflowDefinition.editStatus != WorkflowDefinition.editStatuses.EDIT){
                            return self.createDefinitionToWorkflow(req, workflow, callback);
                        }
                        return callback(null, workflowDefinition);

                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function clearExistingServices(workflowDefinition, callback) {
                    logger.info('SET');
                    workflowDefinition.getDefinitionServices().then(function (items) {
                            async.each(
                                items,
                                function (item, innerCallback) {
                                    item.destroy().then(function () {
                                        innerCallback();
                                    })
                                },
                                function(err){
                                    callback(null, workflowDefinition);
                                }
                            );
                        }
                    ).catch(function (err) {
                        callback( err.message );
                    });
                },
                function updateServices(workflowDefinition, callback) {

                    selectedServicesData = ArrayUtil.sort(selectedServicesData, 'orderNum');

                    async.forEachOf(selectedServicesData, function (selectedServiceData, index, innerCallback) {
                        selectedServiceData.orderNum = index;
                        self._saveWorkflowDefinitionService( workflowDefinition, selectedServiceData, innerCallback );
                    }, function (err) {
                        callback(err);
                    });
                }
            ],
            function (err) {
                if(err){
                    logger.error(err);
                    return cb(err);
                }
                cb(null, 'todo');
            }
        );
    };

    this.createDefinitionToWorkflow = function(req, workflow, cb){

        async.waterfall([
            function getCurrentUser(callback) {
                userService.getCurrentUser(req, callback);
            },
            function createDefinition(user, callback) {

                var workflowDefinitionData = {
                    name : workflow.name,
                    description : workflow.description,
                    purpose: workflow.purpose,
                    projectId: workflow.projectId,
                    userId: user.id,
                    workflowId: workflow.id,
                    accessStatus: WorkflowDefinition.accessStatuses.PRIVATE
                };

                WorkflowDefinition.create(
                    workflowDefinitionData, { fields: ['name', 'description', 'purpose', 'projectId', 'userId', 'workflowId', 'accessStatus'] }
                ).then(function ( definition ) {
                        callback(null, definition, user);
                    }).catch(function (err) {
                        callback(err.message);
                    });
            },
            function addUser(definition, user, callback) {

                WorkflowDefinitionUser.create({
                    userId: user.id,
                    workflowDefinitionId: definition.id,
                    role: WorkflowDefinitionUser.roles.OWNER
                }).then(function () {
                    logger.debug('User added');
                    return callback(null, definition);
                }).catch(function (e) {
                    return callback(e.message);
                });
            },
            function addWorkflow(definition, callback) {
                workflow.setWorkflowDefinition(definition).then(function () {
                    return callback(null, definition);
                }).catch(function (e) {
                    return callback(e.message);
                });
            }
        ], function (err, definition) {
            if(err){
                logger.error('Create from workflow error: ', err);
            }
            cb(err, definition);
        });
    };

    this._saveWorkflowDefinitionService = function ( workflowDefinition, serviceData, cb ) {

        async.waterfall(
            [
                function createService(callback) {
                    var data = {
                        serviceId: serviceData.serviceId,
                        serviceParamsValues: serviceData.serviceParamsValues,
                        orderNum: serviceData.orderNum,
                        workflowDefinitionId: workflowDefinition.id
                    };

                    WorkflowDefinitionServiceModel.create(data).then(function (definitionService) {
                        callback(null, definitionService);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                }
            ],
        function (err) {
            if(err){
                logger.error('_saveWorkflowDefinitionService  ', err);
            }
            cb(err);
        });
    };

    this.getCurrentUserWorkflowDefinitionsList = function (req, params, cb) {
        params.userId = req.redisSession.data.userId;
        workflowDefinitionDaoService.getUserWorkflowDefinitionsList(params, function (err, data) {
            if(err){
                logger.error(err);
                return cb(err);
            }
            var camelData = data.map(function (item) {
                item = ObjectUtil.snakeToCame(item);
                item.publicUrl = self.getDefinitionPublicUrl(item);
                return item;
            });
            cb( null, camelData);

        });
    };

    this.getDefinitionPublicUrl = function (definition) {
        if(definition.accessStatus == WorkflowDefinition.accessStatuses.PUBLIC){
            return config.appUrl + '/#/public/definition/' + definition.id;
        }
        return null;
    };

    this.getCopyFromWorkflow = function (req, oldWorkflowId, cb) {

        var user;
        var oldWorkflow;
        var definition;

        async.waterfall([
                function (callback) {
                    userService.getCurrentUser(req, callback);
                },
                function (userItem, callback) {
                    user = userItem;
                    workflowDaoService.getWorkflow(oldWorkflowId, callback);
                },
                function (oldWorkflowItem, callback) {
                    oldWorkflow = oldWorkflowItem;

                    oldWorkflow.getWorkflowDefinition().then(function (fromDefinition) {
                        definition = fromDefinition;
                        return callback();
                    });
                },

                function (callback) {

                    var workflowData = {
                        projectId   : oldWorkflow.projectId,
                        workflowDefinitionId: definition.id,
                        userId      : user.id,
                        name        : oldWorkflow.name,
                        description : oldWorkflow.description,
                        purpose     : oldWorkflow.purpose
                    };
                    Workflow.create(workflowData).then(function (workflow) {
                        callback( null, workflow);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function (workflow, callback) {

                    if(!definition){
                        self._createDefinitionFromWorkflow(req, oldWorkflow, function (err, newDefinition) {
                            definition = newDefinition;
                            workflow.workflowDefinitionId = newDefinition.id;
                            workflow.save().then(function () {
                                callback(err, workflow);
                            });
                        });
                    } else {
                        callback(null, workflow);
                    }
                }
            ],
            function (err, workflow) {
                if(err){
                    logger.error(err);
                }
                cb(err, workflow);
            }
        );

        this._createDefinitionFromWorkflow = function (req, workflow, cb) {

            async.waterfall(
                [
                    function (callback) {
                        self.createDefinitionToWorkflow(req, workflow, callback)
                    },
                    function (definition, callback) {
                        workflow.getWorkflowServices().then(function (workflowServices) {
                            callback(null, definition, workflowServices);
                        });
                    },
                    function (definition, workflowServices, callback) {

                        async.each(workflowServices, function (workflowService, innerCb) {

                            var data = {
                                serviceId: workflowService.serviceId,
                                serviceParamsValues: workflowService.serviceParamsValues,
                                orderNum: workflowService.orderNum,
                                workflowDefinitionId: definition.id
                            };

                            WorkflowDefinitionServiceModel.create(data).then(function (definitionService) {
                                return innerCb();
                            }).catch(function (err) {
                                return innerCb( err.message );
                            });
                        }, function (err) {
                            return callback(err, definition);
                        });
                    }

                ],
                cb
            );
        };
    };
}

module.exports = new WorkflowDefinitionService();