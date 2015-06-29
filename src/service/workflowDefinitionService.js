/**
 * Created by taivo on 12.06.15.
 */

var workflowDefinitionDaoService = require(__base + 'src/service/dao/workflowDefinitionDaoService');
var WorkflowDefinitionServiceParamValue = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceParamValue;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var WorkflowDefinitionServiceModel = require(__base + 'src/service/dao/sql').WorkflowDefinitionServiceModel;
var projectService = require(__base + 'src/service/projectService');
var serviceService = require(__base + 'src/service/serviceService');
var Sequelize = require('sequelize');

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

    this.createWorkflowDefinition = function(req, projectId, workflowDefinitionData, callback) {

        projectService.getProject(req, projectId, function(error, project) {
            if (error) {
                return callback(error);
            }

            WorkflowDefinition.create(workflowDefinitionData).then(function(workflowDefinition) {

                project.addWorkflowDefinition(workflowDefinition).then(function() {

                    return callback(null, workflowDefinition);
                }).catch(function(error) {

                    return callback(error);
                });
            }).catch(function(error) {

                return callback(error);
            });
        });

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