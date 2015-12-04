
var logger = require('log4js').getLogger('meta_service');

var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var User = require(__base + 'src/service/dao/sql').User;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var Service = require(__base + 'src/service/dao/sql').Service;
var async = require('async');

function MetaService() {
    var self = this;

    this.getBreadcrumbFields = function(req, query, cb) {

        var response = {};

        async.parallel([
            function (callback) {
                if(!query.projectId){
                    return callback();
                }
                Project.find({where:{id: query.projectId},attributes:['id', 'name']}).then(function (item) {
                    response.projectId = item ? item.name : '';
                    callback()
                });
            },
            function (callback) {
                if(!query.workflowId){
                    return callback();
                }
                Workflow.find({where:{id: query.workflowId},attributes:['id','name','projectId']}).then(function (item) {
                    response.workflowId = item ? item.name : '';
                    callback();
                });
            },
            function (callback) {
                if(!query.definitionId){
                    return callback();
                }
                WorkflowDefinition.find({where:{id: query.definitionId},attributes:['id','name']}).then(function (item) {
                    response.definitionId = item ? item.name : '';
                    callback();
                });
            },
            function (callback) {
                if(!query.userId){
                    return callback();
                }
                User.find({where:{id: query.userId},attributes:['id','name']}).then(function (item) {
                    response.userId = item ? item.name : '';
                    callback()
                });
            },
            function (callback) {
                if(!query.serviceId){
                    return callback();
                }
                Service.find({where:{id: query.serviceId},attributes:['id','name']}).then(function (item) {
                    response.serviceId = item ? item.name : '';
                    callback()
                });
            },
            function (callback) {
                if(!query.resourceTypeId){
                    return callback();
                }
                ResourceType.find({where:{id: query.resourceTypeId},attributes:['id','name']}).then(function (item) {
                    response.resourceTypeId = item ? item.name : '';
                    callback()
                });
            }
        ], function (err) {
            cb(err, response);
        });
    };
}

module.exports = new MetaService();