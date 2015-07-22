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

    this.createWorkflowDefinition = function(req, projectId, workflowDefinitionData, cb) {
        workflowDefinitionData.project_id = projectId;
        workflowDefinitionData.user_id = 1;

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
                WorkflowDefinition.create(workflowDefinitionData).then(function(workflowDefinition) {
                    return callback(null, project, workflowDefinition);
                }).catch(function(error) {
                    return callback(error);
                });
            },

            function addWorkflowDefinitionToProject(project, workflowDefinition, callback) {
                project.addWorkflowDefinition(workflowDefinition).then(function() {
                    return callback(null, workflowDefinition);
                }).catch(function(error) {
                    return callback(error);
                });
            },

            function createWorkflowDefinitionServices(workflowDefinition, callback) {
                var orderNum = 0;

                async.eachSeries(workflowDefinitionData.serviceIds, function(serviceId, innerCallback) {
                    serviceService.getService(req, serviceId, function(err, service) {
                        var idx = workflowDefinitionData.serviceIds.indexOf(serviceId + '');
                        if (err) {
                            return callback(err);
                        }

                        var workflowDefinitionServiceModel = WorkflowDefinitionServiceModel.build({
                            service_id: service.id,
                            order_num: orderNum
                        });

                        orderNum++;

                        workflowDefinitionServiceModel.save().then(function(workflowDefinitionServiceModel) {
                            workflowDefinition.addWorkflowService(workflowDefinitionServiceModel).then(function(workflowDefinition) {
                                for (var j = 0; j < workflowDefinitionData.serviceParam[idx].length; j++) {
                                    var serviceParamData = workflowDefinitionData.serviceParam[idx][j];
                                    var workflowDefinitionServiceParamValue = WorkflowDefinitionServiceParamValue.build({
                                        service_param_id: serviceParamData.id,
                                        value: serviceParamData.value
                                    });
                                    workflowDefinitionServiceParamValue.save().then(function(workflowDefinitionServiceParamValue) {
                                        workflowDefinitionServiceModel.addParamValue(workflowDefinitionServiceParamValue);
                                    }).catch(function(error) {
                                        innerCallback(error);
                                    });
                                }
                                innerCallback();
                            }).catch(function(error) {
                                console.log(error);

                                innerCallback(error);
                            });
                        }).catch(function(error) {
                            console.log(error);

                            innerCallback(error);
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
                return cb(err);
            }
            return cb(null, workflowDefinition);
        });

        //projectService.getProject(req, projectId, function(error, project) {
        //    if (error) {
        //        return callback(error);
        //    }
        //
        //
        //
        //
        //
        //
        //    WorkflowDefinition.create(workflowDefinitionData).then(function(workflowDefinition) {
        //
        //        project.addWorkflowDefinition(workflowDefinition).then(function() {
        //
        //            return callback(null, workflowDefinition);
        //        }).catch(function(error) {
        //
        //            return callback(error);
        //        });
        //    }).catch(function(error) {
        //
        //        return callback(error);
        //    });
        //});

    };

    this.saveWorkflowDefinition = function(req, workflowDefinitionId, workflowDefinitionData, callback) {

        self.getWorkflowDefinition(req, workflowDefinitionId, function(err, workflowDefinition) {
            if (err) {
                return callback(err);
            }

            workflowDefinition.updateAttributes(workflowDefinitionData).then(function(workflowDefinition) {

                return callback(null, workflowDefinition);
            }).catch(function(err) {

                return callback(err);
            });

        });
    };

    this.getWorkflowDefinitionServiceModel = function(req, id, callback) {

        return workflowDefinitionDaoService.findWorkflowDefinitionServiceModel(id, callback);
    };

    this.createWorkflowDefinitionServiceModel = function(req, workflowDefinitionId, workflowDefinitionServiceData, callback) {

        self.getWorkflowDefinition(req, workflowDefinitionId, function(err, workflowDefinition) {
            if (err) {
                return callback(err);
            }

            serviceService.getService(req, workflowDefinitionServiceData.service_id, function(error, serviceModel) {
                if (error) {
                    return callback(error);
                }

                var workflowDefinitionServiceModel = WorkflowDefinitionServiceModel.build({
                    service_id: serviceModel.id
                }).save().then(function(workflowDefinitionServiceModel) {

                    serviceModel.getServiceParams().then(function(serviceParams) {

                        serviceParams.forEach(function(serviceParam) {
                            var workflowDefinitionServiceParamValue = WorkflowDefinitionServiceParamValue.build({
                                service_param_id: serviceParam.id
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


                    //workflowDefinition.addWorkflowService(workflowDefinitionServiceModel).then(function () {
                    //    return callback(null, workflowDefinitionServiceModel);
                    //}).catch(function (error) {
                    //    return callback(error);
                    //});

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
            WorkflowDefinitionServiceModel.update({order_num: (i+1)}, { where: { id: ids[i]} }).catch(function(error) {
                return callback(error);
            });
        }
        return callback();
    };
}

module.exports = new WorkflowDefinitionService();