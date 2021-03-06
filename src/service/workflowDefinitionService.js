/**
 * Created by taivo on 12.06.15.
 */
var logger = require('log4js').getLogger('workflow_definition_service');
var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var User = require(__base + 'src/service/dao/sql').User;
var ServiceModel = require(__base + 'src/service/dao/sql').Service;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var WorkflowDefinitionUser = require(__base + 'src/service/dao/sql').WorkflowDefinitionUser;
var NotificationType = require(__base + 'src/service/dao/sql').NotificationType;
var async = require('async');
var ArrayUtil = require(__base + 'src/util/arrayUtils');
var ObjectUtil = require(__base + 'src/util/objectUtils');
var userService = require('./userService');
var notificationService = require('./notificationService');
var projectService = require('./projectService');

var config = require(__base + 'config');


function WorkflowDefinitionService() {

    var self = this;

    this.canViewDefinitionById = function (req, definitionId, cb) {

        if( req.redisSession.data.role == User.roles.ROLE_ADMIN ){
            return cb(null, true);
        }

        WorkflowDefinition.find({
            where: {
                id: definitionId
            },
            attributes: ['id', 'userId', 'accessStatus', 'projectId']
        }).then(function (definition) {

            if(!definition){
                return cb(null, false);
            }

            if(definition.accessStatus == WorkflowDefinition.accessStatuses.PUBLIC){
                return cb(null, true);
            }

            if(definition.accessStatus == WorkflowDefinition.accessStatuses.PRIVATE && definition.userId == req.redisSession.data.userId){
                return cb(null, true);
            }

            definition.getSharedUsers({where:{userId: req.redisSession.data.userId}}).then(function (relations) {
                if(relations.length > 0){
                    if(definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED){
                        return cb(null, true);
                    }
                } else {
                    projectService.canEditProjectById(req, definition.projectId, function (err, success) {
                        if(err){
                            return cb(err);
                        }

                        return cb(null, success);
                    });
                }
            }).catch(function (err) {
                cb(err.message);
            });
        }).catch(function (err) {
            logger.error(err);
            cb(err.message);
        });
    };

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
                var workflow = Workflow.build(workflowDefinitionData, {fields: ['name', 'description', 'purpose', 'projectId', 'userId']});
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

                WorkflowDefinitionUser.create({
                    role: WorkflowDefinitionUser.roles.OWNER,
                    userId: workflow.userId,
                    workflowDefinitionId: definition.id
                }).then(function () {
                    return callback(null, definition, workflow);
                }).catch(function (e) {
                    return callback('Err: ' + e.message);
                });
            },
            function (definition, workflow, callback) {
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

                    var accessStatus = workflow.workflowDefinition ? workflow.workflowDefinition.accessStatus : null;
                    var canEditAccessStatus = workflow.workflowDefinition ? workflow.workflowDefinition.workflowId == workflow.id : false;

                    var result = {
                        id: workflow.id,
                        name: workflow.name,
                        description: workflow.description,
                        purpose: workflow.purpose,
                        accessStatus: accessStatus,
                        canEditAccessStatus: canEditAccessStatus
                    };


                    if(workflow.workflowDefinition){
                        return workflow.workflowDefinition.getWorkflowDefinitionUsers().then(function (relations) {
                            result.users = relations.map(function (item) {
                                return item.id;
                            });
                            callback(null, result);
                        });
                    }
                    callback(null, result);

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

        var userId = req.redisSession.data.userId;

        async.waterfall(
            [
                function (callback) {
                    self.canViewDefinitionById(req, definitionId, function (err, canView) {
                        if(err){
                            return callback(err);
                        }
                        if(!canView){
                            return callback({
                                code: 404,
                                message: 'Töövoo definitsiooni ei leitud'
                            });
                        }
                        return callback();
                    });
                },
                function (callback) {
                    WorkflowDefinition.find({
                        where: {
                            id: definitionId
                        },
                        attributes:[
                            'id',
                            'projectId',
                            'name',
                            'description',
                            'purpose',
                            'accessStatus',
                            'editStatus',
                            'createdAt',
                            'updatedAt',
                            'publishedAt'
                        ],
                        include: [
                            {
                                model: WorkflowDefinitionUser,
                                as: 'sharedUsers',
                                attributes:[ 'role' ],
                                required: false,
                                include: [{
                                    model: User,
                                    as: 'user',
                                    attributes:['id','name', 'displaypicture'],
                                    required: false
                                }]
                            },
                            {
                                model: WorkflowDefinitionServiceModel,
                                as: 'definitionServices',
                                attributes:['id','orderNum','serviceParamsValues'],
                                required: false,
                                include: [
                                    {
                                        model: ServiceModel,
                                        as: 'service',
                                        attributes:['id','name'],
                                        required: false
                                    }
                                ]
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
                },
                function (item, callback) {

                    item.getBookmarkedUsers({where: {id: req.redisSession.data.userId}}).then(function (users) {

                        item = item.toJSON();
                        item.isBookmarked = users.length == 1;

                        if(item.accessStatus == WorkflowDefinition.accessStatuses.PUBLIC){
                            item.publicUrl = self.getDefinitionPublicUrl(item);
                        }
                        item.definitionServices.sort(function (a, b) {
                            return a.orderNum > b.orderNum;
                        });
                        callback(null, item);

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
                    if(!definition && workflow.status == Workflow.statusCodes.INIT){
                        self.createDefinitionToWorkflow(req, workflow, function (err, definition) {
                            callback(null, workflow, definition);
                        });
                    } else {
                        callback(null, workflow, definition);
                    }
                });
            },
            function updateDefinition(workflow, definition, callback) {
                if(definition && definition.workflowId == workflow.id){
                    var updateFields = ['name', 'description', 'purpose', 'accessStatus'];
                    definition.updateAttributes(data, {fields:updateFields}).then(function () {
                        callback(null, workflow, definition);
                    });
                } else {
                    callback(null, workflow, definition);
                }
            },
            function (workflow, definition, callback) {
                if(definition && definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED ){
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

    
    this.updateWorkflowDefinitionSettings = function (req, data, cb) {

        logger.debug('Update settings');

        async.waterfall(
            [
                function (callback) {
                    self.canViewDefinitionById(req, data.id, function (err, canView) {
                       if(err || !canView){
                           if(err){
                               logger.error(err);
                           }
                           return callback('Kasutajal puudub töövoo muutmiseks ligipääs');
                       }
                        callback()
                    });
                },
                function (callback) {
                    WorkflowDefinition.findById( data.id).then(function (definition) {
                        logger.debug('Definition found');
                        callback(null, definition);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },

                function (definition, callback) {

                    if( definition.accessStatus == WorkflowDefinition.accessStatuses.PUBLIC &&
                        data.accessStatus != WorkflowDefinition.accessStatuses.PUBLIC &&
                        req.redisSession.data.role == User.roles.ROLE_ADMIN &&
                        req.redisSession.data.userId != definition.userId ){

                        notificationService.addNotification(definition.userId, NotificationType.codes.WORKFLOW_DEFINITION_UNPUBLISHED, definition.id, function (err, notification) {
                            if(err){
                                logger.error(err);
                            }
                            return callback(null, definition);
                        });
                    } else {
                        return callback(null, definition);
                    }
                },
                function (definition, callback) {
                    logger.debug('Update attributes');

                    definition.updateAttributes(data, {fields:['name', 'description', 'purpose', 'accessStatus']}).then(function () {
                        logger.debug('Attributes Updated ');
                        callback(null, definition);
                    })
                },
                function (definition, callback) {
                    if( definition.accessStatus == WorkflowDefinition.accessStatuses.SHARED ){
                        return self._updateDefinitionUserRelations( req, definition, data.users, function (err, definition) {
                            return callback(null, definition);
                        });
                    }
                    return callback(null, definition);
                },
                function (definition, callback) {
                    self.getWorkflowDefinitionOverview(req, definition.id, callback);
                }
            ], 
            function (err, overview) {
                if(err){
                    logger.error(err);
                }
                cb(err, overview);
            }
        );
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
                definition.getSharedUsers().then(function (existingRelations) {
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

                definition.getSharedUsers().then(function (existingRelations) {

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

                            User.findById(newRelationUserId).then(function (user) {
                                if(!user){
                                    return innerCb('Kasutajat ei leitud');
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
                            }).catch(function (e) {
                                return innerCb('Err' + e.message);
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
                }
                return cb(err);
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
                        workflowDefinitionId: definition ? definition.id : null,
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
                        self.createDefinitionToWorkflow(req, workflow, function (err, definition) {
                            self._createDefinitionServicesFromWorkflow(req, oldWorkflow, definition, function (err) {
                                workflow.workflowDefinitionId = definition.id;
                                workflow.save().then(function () {
                                    callback(err, workflow);
                                });
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
    };


    this._createDefinitionServicesFromWorkflow = function (req, workflow, definition, cb) {

        async.waterfall(
            [
                function ( callback ) {

                    if(!definition){
                        return callback('Definition is not set.');
                    }

                    workflow.getWorkflowServices().then(function (workflowServices) {
                        callback(null, definition, workflowServices);
                    }).catch(function (err) {
                        callback(err.message);
                    });
                },
                function (definition, workflowServices, callback) {

                    logger.debug('Start each');


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
                            logger.error(err);
                            return innerCb( err.message );
                        });
                    }, function (err) {
                        return callback(err);
                    });
                }

            ],
            cb
        );
    };


    this.getProjectWorkflowDefinitionsList = function(req, projectId, cb) {
        logger.debug('Get project workflowdefinitions list');

        projectService.canViewProjectById(req, projectId, function(err, canView) {
            if (err) {
                return cb(err);
            }
            if(!canView){
                return cb('Kasutajal puudub projektile ligipääs');
            }

            workflowDefinitionDaoService.getProjectWorkflowDefinitionsList(projectId, req.redisSession.data.userId, function (err, definitions) {
                if (err) {
                    return cb(err);
                }
                async.map(definitions,
                    function(definition, innerCb){
                        definition = ObjectUtil.snakeToCame(definition);
                        innerCb(null, definition);
                    },
                    function(err, result){
                        cb(null, result);
                    }
                );
            });
        });
    };

    this.getWorkflowDefinitionsManagementList = function ( req, params, cb ) {
        logger.debug('Get definitionsList management list');

        workflowDefinitionDaoService.getWorkflowDefinitionsManagementList( params, function (err, listData) {
            if (err) {
                return cb(err);
            }
            async.map(listData.rows,
                function(row, innerCb){
                    row = ObjectUtil.snakeToCame( row );
                    innerCb(null, row);
                },
                function(err, result){
                    listData.rows = result;
                    cb(null, listData);
                }
            );
        });
    };

    this.toggleWorkflowDefinitionBookmark = function( req, definitionId, cb){

        WorkflowDefinition.findById(definitionId).then(function (definition) {
            if(!definition){
                return cb('Töövoo definitsiooni ei leitud');
            }

            definition.getBookmarkedUsers({where: { id: req.redisSession.data.userId }}).then(function (users) {
                userService.getCurrentUser(req, function (err, user) {
                    if(err){
                        return cb(err);
                    }

                    if(users.length > 0) {
                        definition.removeBookmarkedUser(user).then(function () {
                            return cb(null, {isBookmarked:false});
                        }).catch(function (err) {
                            return cb( err.message );
                        });
                    } else {

                        definition.addBookmarkedUser(user).then(function () {
                            return cb(null, {isBookmarked:true});
                        }).catch(function (err) {
                            return cb( err.message );
                        });
                    }
                });
            }).catch(function (err) {
                return cb( err.message );
            });
        });
    };

    this.deleteWorkflowDefinition = function(req, definitionId, cb) {

        WorkflowDefinition.findById(definitionId).then(function (definition) {
            if(!definition){
                return cb('Töövoo definitsiooni ei leitud');
            }

            self.canViewDefinitionById(req, definitionId, function (err, success) {
                if(err){
                    return cb(err);
                }
                if(!success){
                    return cb('Kasutajal ei ole õigust antud töövoogu kustutada.');
                }

                definition.destroy().then(function () {
                   return cb();
                });
            });
        }).catch(function (err) {
            return cb( err.message );
        });
    };
}

module.exports = new WorkflowDefinitionService();