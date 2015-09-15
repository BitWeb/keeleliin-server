/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_service');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var userDaoService = require('./dao/userDaoService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var projectService = require(__base + 'src/service/projectService');
var serviceService = require(__base + 'src/service/serviceService');
var async = require('async');
var ArrayUtil = require(__base + 'src/util/arrayUtils');
var ObjectUtil = require(__base + 'src/util/objectUtils');
var userService = require('./userService');

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
            function createDefinition(user, callback) {
                workflowDefinitionData.userId = user.id;
                var definition = WorkflowDefinition.build(workflowDefinitionData, {fields: ['name', 'description', 'purpose', 'projectId', 'userId', 'accessStatus']});

                definition.validate().then(function (err) {
                    if (err) {
                        return callback(err.message);
                    }
                    definition.save().then(function () {
                        callback(null, definition, user);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                });
            },
            function (definition, user, callback) {
                definition.addWorkflowDefinitionUser( user, { role: WorkflowDefinitionUser.roles.OWNER }).then(function () {
                    return callback(null, definition);
                }).catch(function (e) {
                    return callback(e.message);
                });
            },
            function (definition, callback) {
                if(definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED){
                    return self._updateDefinitionUserRelations( req, definition, workflowDefinitionData.users, callback );
                }
                return callback(null, definition);
            },
            function createInitWorkflowBasedOnDefinition(definition, callback) {
                var workflowData = {
                    projectId   : definition.projectId,
                    workflowDefinitionId: definition.id,
                    userId      : definition.userId,
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
                                attributes:['id','accessStatus']
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
                        accessStatus: workflow.workflowDefinition.accessStatus
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

    this.updateWorkflowSettings = function (req, workflowId, data, cb) {
        async.waterfall([
            function (callback) {

                Workflow.find({
                    where: {id: workflowId}
                }).then(function (workflow) {
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
                   callback(null, workflow, definition);
                });
            },
            function (workflow, definition, callback) {
                var updateFields = ['name', 'description', 'purpose', 'accessStatus'];
                if(definition.editStatus == WorkflowDefinition.editStatuses.LOCKED){
                    updateFields = [ 'accessStatus' ];
                }

                definition.updateAttributes(data, {fields:updateFields}).then(function () {
                    callback(null, workflow, definition);
                });
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
                                definition.addWorkflowDefinitionUser(user, {role: WorkflowDefinitionUser.roles.EDITOR}).then(function () {
                                    return innerCb();
                                }).catch(function (e) {
                                    return innerCb(e.message);
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
                            return self._createDefinitionFromWorkflow(req, workflow, callback);
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
                    async.each(selectedServicesData, function (selectedServiceData, innerCallback) {
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

    this._createDefinitionFromWorkflow = function(req, workflow, cb){

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
                    accessStatus: WorkflowDefinition.accessStatuses.PRIVATE
                };

                WorkflowDefinition.create(
                    workflowDefinitionData, { fields: ['name', 'description', 'purpose', 'projectId', 'userId', 'accessStatus'] }
                ).then(function ( definition ) {
                        callback(null, definition, user);
                    }).catch(function (err) {
                        callback(err.message);
                    });
            },
            function (definition, user, callback) {
                definition.addWorkflowDefinitionUser( user, { role: WorkflowDefinitionUser.roles.OWNER }).then(function () {
                    logger.debug('User added');
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
                        orderNum: serviceData.orderNum,
                        workflowDefinitionId: workflowDefinition.id
                    };
                    var workflowDefinitionService = WorkflowDefinitionServiceModel.create(data).then(function (definitionService) {
                        callback(null, definitionService);
                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function copyNotEditableParams(definitionService, callback) {
                    definitionService.getService().then( function ( service ) {
                        logger.debug('getServiceParams');
                        service.getServiceParams({
                            where: {isEditable: false }
                        }).then(function (params) {

                            var paramsMap = params.map(function (item) {
                                return {
                                    serviceParamId: item.id,
                                    value: item.value
                                }
                            });
                            self._addServiceParams(definitionService, paramsMap, callback);
                        }).catch(function (err) {
                            callback( err.message );
                        });
                    }).catch(function (err) {
                        callback( err.message );
                    });
                },
                function saveParams(definitionService, callback) {
                    self._addServiceParams(definitionService, serviceData.paramValues, callback);
                }
            ],
        function (err) {
            if(err){
                logger.error('_saveWorkflowDefinitionService  ', err);
            }
            cb(err);
        });
    };

    this._addServiceParams = function (definitionService, paramsMap, cb) {

        async.eachSeries(paramsMap, function (item, callback) {
            definitionService.getParamValues({where: {
                serviceParamId: item.serviceParamId
            }}).then(function (excistingValues) {
                if(excistingValues.length > 0){
                    return callback();
                }
                var paramValue = WorkflowDefinitionServiceParamValue.build(item, ['serviceParamId', 'value']);
                definitionService.addParamValue(paramValue).then(function () {
                    return callback();
                }).catch(function (err) {
                    logger.error(paramsMap);
                    callback( err.message );
                });
            });
        }, function (err) {
            if(err){
                logger.error('_addServiceParams ', err);
            }
            cb(err, definitionService);
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
                return ObjectUtil.snakeToCame(item);
            });
            cb( null, camelData);

        });
    }
}

module.exports = new WorkflowDefinitionService();