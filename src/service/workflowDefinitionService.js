/**
 * Created by taivo on 12.06.15.
 */

var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionService;
var projectService = require(__base + 'src/service/projectService');
var serviceService = require(__base + 'src/service/serviceService');
var Sequelize = require('sequelize');
var async = require('async');
var ArrayUtils = require(__base + 'src/util/arrayUtils');

function WorkflowDefinitionService() {

    var self = this;

    this.getWorkflowDefinition = function(req, workflowDefinitionId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinition(workflowDefinitionId, callback);
    };

    this.getWorkflowDefinitionsByProject = function(req, projectId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionsByProjectId(projectId, callback);
    };

    this.getWorkflowDefinitionServiceParamValues = function(req, workflowDefinitionServiceId, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionServiceParamValues(workflowDefinitionServiceId, callback);
    };

    this.getWorkflowDefinitionServiceParamValue = function(req, workflowDefinitionServiceParamValueId, cb) {
        WorkflowDefinitionServiceParamValue.find({
            where: { id: workflowDefinitionServiceParamValueId }
        }).then(function(workflowDefintionServiceParam) {
            if (!workflowDefintionServiceParam) {
                return cb('Workflow definition param not found.');
            }

            return cb(null, workflowDefintionServiceParam);
        });
    };

    this.getWorkflowDefinitionServiceModel = function(req, id, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionServiceModel(id, callback);
    };

    this.createWorkflowDefinition = function(req, projectId, workflowDefinitionData, cb) {
        workflowDefinitionData.projectId = projectId;
        //workflowDefinitionData.user_id = 1;

        async.waterfall([
            function getProject(callback) {
                projectService.getProject(req, projectId, function(error, project) {
                    if (error) {
                        return callback(error);
                    }
                    return callback(null, project);
                });
            },

            function createWorkflowDefinition(project, callback) {
                self._createWorkflowDefinitionInstance(req, workflowDefinitionData, function(err, workflowDefinition) {
                    if (err) {
                        return callback(err);
                    }

                    project.addWorkflowDefinition(workflowDefinition).then(function() {
                        return callback(null, workflowDefinition);
                    }).catch(function(error) {
                        return callback(error);
                    });
                });
            },

            function createWorkflowDefinitionServices(workflowDefinition, callback) {
                if (workflowDefinitionData.serviceIds == undefined) {

                    return callback(null, workflowDefinition);
                }

                var orderNum = 0;
                async.eachSeries(workflowDefinitionData.serviceIds, function(serviceId, innerCallback) {
                    serviceService.getService(req, serviceId, function(err, service) {
                        var idx = workflowDefinitionData.serviceIds.indexOf(serviceId + '');
                        if (err) {
                            return innerCallback(err);
                        }

                        self._createWorkflowDefinitionServiceModelInstance(req, {
                            serviceId: service.id,
                            orderNum: orderNum
                        }, function(err, workflowDefinitionServiceModel) {
                            if (err) {
                                return innerCallback(err);
                            }

                            orderNum++;

                            workflowDefinition.addWorkflowService(workflowDefinitionServiceModel).then(function() {
                                if (workflowDefinitionData.workflowDefinitionServiceParam[idx] == undefined) {
                                    return innerCallback();
                                }

                                async.eachSeries(workflowDefinitionData.workflowDefinitionServiceParam[idx], function(serviceParamData, innerInnerCallback) {
                                    self._createWorkflowDefinitionServiceParamValueInstance(req, {
                                        serviceParamId: serviceParamData.serviceParamId,
                                        value: serviceParamData.value
                                    }, function(err, workflowDefinitionServiceParamValue) {
                                        if (err) {
                                            return innerInnerCallback(err);
                                        }

                                        workflowDefinitionServiceModel.addParamValue(workflowDefinitionServiceParamValue).then(function() {
                                            return innerInnerCallback();
                                        }).catch(function(err) {
                                            return innerInnerCallback(err);
                                        });
                                    });

                                }, function(err) {
                                    if (err) {
                                        return innerCallback(err);
                                    }
                                    return innerCallback();
                                });

                            }).catch(function(err) {
                                return innerCallback(err);
                            });
                        });

                    });
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, workflowDefinition);
                });
            }
        ], function(err, workflowDefinition) {
            if (err) {

                console.log(err);
                return cb(err);
            }
            return cb(null, workflowDefinition);
        });
    };

    /**
     * Assuming that WF service model params are always saved with WF service model
     * and no WF service model params is added/removed.
     * If user removes WF service, then WF service params is removed as well.
     * If user adds new WF service, then new WF service params are added.
     */
    this.saveWorkflowDefinition = function(req, workflowDefinitionId, workflowDefinitionData, cb) {

        async.waterfall([
            function saveWorkflowDefinition(callback) {
                self._saveWorkflowDefinitionInstance(req, workflowDefinitionId, workflowDefinitionData, function(err, workflowDefinition) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, workflowDefinition);
                });
            },

            function collectWorkflowDefinitionCurrentServiceIds(workflowDefinition, callback) {
                workflowDefinition.getWorkflowServices().then(function(workflowServices) {
                    var ids = [];
                    workflowServices.forEach(function(workflowService) {
                       ids.push(workflowService.id);
                    });
                    return callback(null, ids, workflowDefinition);
                });
            },

            function addOrUpdateWorkflowDefintionServices(workflowDefinitionServiceIds, workflowDefinition, callback) {
                var serviceIds = workflowDefinitionData.serviceIds || [],
                    addedIds = [],
                    orderNum = 0;

                async.eachSeries(serviceIds, function(serviceId, innerCallback) {
                    var idx = workflowDefinitionData.serviceIds.indexOf(serviceId + '');
                    self.getWorkflowDefinitionServiceModel(req, workflowDefinitionData.workflowDefinitionServiceIds[idx], function(err, workflowDefinitionServiceModel) {
                        if (!workflowDefinitionServiceModel) {
                            serviceService.getService(req, serviceId, function(err, service) {
                                if (err) {
                                    return innerCallback(err);
                                }

                                self._createWorkflowDefinitionServiceModelInstance(req, {
                                    serviceId: service.id,
                                    orderNum: orderNum
                                }, function(err, workflowDefinitionServiceModel) {
                                    if (err) {
                                        return innerCallback(err);
                                    }

                                    orderNum++;

                                    workflowDefinition.addWorkflowService(workflowDefinitionServiceModel).then(function(workflowDefinition) {
                                        if (workflowDefinitionData.workflowDefinitionServiceParam[idx] == undefined) {
                                            return innerCallback();
                                        }

                                        async.eachSeries(workflowDefinitionData.workflowDefinitionServiceParam[idx], function(serviceParamData, innerInnerCallback) {
                                            self._createWorkflowDefinitionServiceParamValueInstance(req, {
                                                serviceParamId: serviceParamData.serviceParamId,
                                                value: serviceParamData.value
                                            }, function(err, workflowDefinitionServiceParamValue) {
                                                if (err) {
                                                    return innerInnerCallback(err);
                                                }
                                                workflowDefinitionServiceModel.addParamValue(workflowDefinitionServiceParamValue).then(function() {
                                                    return innerInnerCallback();
                                                }).catch(function(err) {
                                                    return innerInnerCallback(err);
                                                });
                                            });

                                        }, function(err) {
                                            if (err) {
                                                return innerCallback(err);
                                            }
                                            return innerCallback();
                                        });

                                    }).catch(function(err) {
                                        return innerCallback(err);
                                    });
                                });

                            });
                        } else {
                            addedIds.push(workflowDefinitionServiceModel.id);

                            self._saveWorkflowDefinitionServiceModelInstance(req, workflowDefinitionServiceModel.id, {
                                orderNum: orderNum
                            }, function(err, workflowDefinitionServiceModel) {
                                if (err) {
                                    return innerCallback(err);
                                }

                                var serviceParams = workflowDefinitionData.workflowDefinitionServiceParam[idx] || [];
                                orderNum++;

                                async.eachSeries(serviceParams, function(serviceParamData, innerInnerCallback) {

                                    self._saveWorkflowDefinitionServiceParamValueInstance(req, serviceParamData.id, serviceParamData, function(err, workflowDefintionServiceParam) {
                                        if (err) {
                                            return innerInnerCallback(err);
                                        }
                                        return innerInnerCallback();
                                    });

                                }, function(err) {
                                    if (err) {
                                        return innerCallback(err);
                                    }
                                    return innerCallback();
                                });
                            });
                        }
                    });
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, workflowDefinition, workflowDefinitionServiceIds, addedIds);
                });
            },

            function removeWorkflowServices(workflowDefinition, workflowServiceIds, addedWorkflowServiceIds, callback) {
                var removableIds = ArrayUtils.arrayDiff(workflowServiceIds, addedWorkflowServiceIds);
                if (removableIds.length > 0) {
                    WorkflowDefinitionServiceModel.destroy({ where: { id: removableIds }}).then(function() {
                        return callback(null, workflowDefinition);
                    }).catch(function(err) {
                        return callback(err);
                    });
                } else {
                    return callback(null, workflowDefinition);
                }
            }

        ], function(err, workflowDefinition) {
            if (err) {
                return cb(err);
            }

            return cb(null, workflowDefinition);
        });
    };

    this.createWorkflowDefinitionServiceModel = function(req, workflowDefinitionId, workflowDefinitionServiceData, callback) {

        self.getWorkflowDefinition(req, workflowDefinitionId, function(err, workflowDefinition) {
            if (err) {
                return callback(err);
            }

            serviceService.getService(req, workflowDefinitionServiceData.serviceId, function(error, serviceModel) {
                if (error) {
                    return callback(error);
                }
                var workflowDefinitionServiceModel = WorkflowDefinitionServiceModel.build({
                    serviceId: serviceModel.id
                }).save().then(function(workflowDefinitionServiceModel) {

                    serviceModel.getServiceParams().then(function(serviceParams) {

                        serviceParams.forEach(function(serviceParam) {
                            var workflowDefinitionServiceParamValue = WorkflowDefinitionServiceParamValue.build({
                                serviceParamId: serviceParam.id
                            });
                            workflowDefinitionServiceModel.addParamValue(workflowDefinitionServiceParamValue);
                        });

                        workflowDefinition.addWorkflowService(workflowDefinitionServiceModel).then(function () {

                            return callback(null, workflowDefinitionServiceModel);
                        }).catch(function (error) {

                            return callback(error);
                        });

                    }).catch(function(error) {

                        return callback(error);
                    });

                });
            });
        });
    };

    this.removeWorkflowDefinitionServiceModel = function(req, workflowDefinitionServiceId, callback) {
        self.getWorkflowDefinitionServiceModel(req, workflowDefinitionServiceId, function(error, workflowDefinitionServiceModel) {
            if (error) {
                return callback(error);
            }

            workflowDefinitionServiceModel.destroy().then(function() {
                return callback();
            }).catch(function(error) {
                return callback(error);
            });
        });
    };

    this.sortWorkflowDefinitionServices = function(req, idsString, callback) {
        var ids = [];
        if (idsString != undefined) {
            ids = idsString.split(',');
        }
        for (var i = 0; i < ids.length; i++) {
            WorkflowDefinitionServiceModel.update({orderNum: (i+1)}, { where: { id: ids[i]} }).catch(function(error) {
                return callback(error);
            });
        }
        return callback();
    };

    this._createWorkflowDefinitionInstance = function(req, workflowDefinitionData, cb) {
        WorkflowDefinition.create(workflowDefinitionData).then(function(workflowDefinition) {
            return cb(null, workflowDefinition);
        }).catch(function(err) {
            return cb(err);
        });
    };

    this._saveWorkflowDefinitionInstance = function(req, workflowDefinitionId, workflowDefinitionData, cb) {

        self.getWorkflowDefinition(req, workflowDefinitionId, function(err, workflowDefinition) {
            if (err) {
                return cb(err);
            }

            console.log(workflowDefinitionData);

            workflowDefinition.updateAttributes(workflowDefinitionData).then(function(workflowDefinition) {
                return cb(null, workflowDefinition);
            }).catch(function(err) {
                return cb(err);
            });
        });
    };

    this._createWorkflowDefinitionServiceModelInstance = function(req, workflowDefinitionServiceData, cb) {
        console.log(workflowDefinitionServiceData);

        WorkflowDefinitionServiceModel.create(workflowDefinitionServiceData).then(function(workflowDefinitionServiceModel) {

            return cb(null, workflowDefinitionServiceModel);
        }).catch(function(err) {

            return cb(err);
        });
    };

    this._saveWorkflowDefinitionServiceModelInstance = function(req, workflowDefinitionServiceId, workflowDefinitionServiceData, cb) {

        self.getWorkflowDefinitionServiceModel(req, workflowDefinitionServiceId, function(err, workflowDefinitionServiceModel) {
            if (err) {
                return cb(err);
            }

            workflowDefinitionServiceModel.updateAttributes(workflowDefinitionServiceData).then(function() {
                return cb(null, workflowDefinitionServiceModel);
            }).catch(function(err) {
                return cb(err);
            });
        });
    };

    this._createWorkflowDefinitionServiceParamValueInstance = function(req, serviceParamValueData, cb) {
        WorkflowDefinitionServiceParamValue.create(serviceParamValueData).then(function(workflowDefinitionServiceParamValue) {

            return cb(null, workflowDefinitionServiceParamValue)
        }).catch(function(err) {

            return cb(err);
        });
    };

    this._saveWorkflowDefinitionServiceParamValueInstance = function(req, workflowDefinitionServiceParamValueId, serviceParamValueData, cb) {
        self.getWorkflowDefinitionServiceParamValue(req, workflowDefinitionServiceParamValueId, function(err, workflowDefintionServiceParam) {
            if (err) {
                return cb(err);
            }

            workflowDefintionServiceParam.updateAttributes({
                value: serviceParamValueData.value
            }).then(function(workflowDefintionServiceParam) {
                return cb(null, workflowDefintionServiceParam);
            }).catch(function(err) {
                return cb(err);
            });
        });
    };

}

module.exports = new WorkflowDefinitionService();