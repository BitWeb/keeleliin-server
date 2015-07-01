/**
 * Created by priit on 30.06.15.
 */
var logger = require('log4js').getLogger('workflow_runner');

var workflowDaoService = require(__base + 'src/service/dao/workflowDaoService');
var resourceDaoService = require(__base + 'src/service/dao/resourceDaoService');
var apiService = require('./service/apiService');

var WorkflowDefinition = require(__base + 'src/service/dao/sql').WorkflowDefinition;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;

var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;

var substepServiceDtoMapper = require('./substep/substepServiceDtoMapper');


var async = require('async');

function Runner(){
    var self = this;

    var workflow;
    var workflowServices;

    //Käivita töövoo
    this.run = function (workflowId, cb) {

        logger.debug('Run workflow id: '  + workflowId);

        //todo
        //1 get workflow
        //2 check workflow status
        //3 get next workflow_service or go 8
        //4 check workflow_service status //error or running go 9
        //5 get workflow_service input_resources | substep back or index
        //6 check if resource is handled from service
        //7 handle resource
        //8 go 3
        //9 finish

        async.waterfall([
            function (callback) {
                self._getWorkflow(workflowId, callback);
            },
            function (callback) {
                self._checkStatusForRun(callback);
            },
            function (callback) {
                self._startWorkflow(callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
                return cb(err);
            }
            return cb(null, workflow);
        });
    };

    this._getWorkflow = function (id, cb) {
        workflowDaoService.getWorkflow(id, function(err, item){
            if(err){
                return cb(err);
            }
            workflow = item;
            cb();
        });
    };

    this._checkStatusForRun = function(cb){
        if(workflow.status != Workflow.statusCodes.INIT){
            return cb('Antud töövoo ühik on juba varem käivitatud');
        }
        return cb()
    };

    this._startWorkflow = function (cb) {

        workflow.status = Workflow.statusCodes.RUNNING;
        workflow.datetime_start = new Date();

        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;

            cb(null, workflow); // return to user

            self._startHandleServices();
        }).catch(function (err) {
            cb(err);
        });
    };

    this._startHandleServices = function(){
        logger.error('handleServices');

        //
        workflow.getWorkflowServices({order: [['order_num', 'ASC']]}).then(function (data) {
            workflowServices = data;
            logger.error(workflowServices);
            self._handleFirstWorkflowService();
        }).catch(function (err) {
            self.finishWorkflow( Workflow.statusCodes.ERROR, function (err, item) {});
        });
    };

    this._handleFirstWorkflowService = function(){

        var workflowService = workflowServices[0];
        if(!workflowService){
            logger.info('No service to handle on index' + 0);
            return true;
        }

        workflowService.order_num = 0;

        workflow.getInputResources().then(function (resources) {
            self._handleFirstWorkflowServiceResources(resources, workflowService);
        }).catch(function (err) {
            logger.error(err);
        });
    };

    this._handleFirstWorkflowServiceResources = function ( resources, workflowService ) {

        async.each(
            resources,
            function (resource, callback) {
                self._makeWorkflowServiceSubStep(resource, workflowService, function (err, substep) {
                    self._runSubstep(substep);
                    callback();
                });
            },
            function (err) {
                if(err){
                    logger.error('_handleFirstWorkflowServiceResources');
                    logger.error(err);
                    return false;
                }
                logger.info('First service handle started');
            }
        );
    };


    this._makeWorkflowServiceSubStep = function ( resource, workflowService, cb) {

        var substepData = {
            workflow_service_id: workflowService.id,
            prev_substep_id: null,
            status: 'INIT',
            index: 0
        };
        WorkflowServiceSubstep.build(substepData).save().then(function (substep){
            substep.addInputResource(resource).then(function (){
                cb(null, substep);
            }).catch(function (err) {
                logger.error('Add resource error');
                logger.error(err);
            });
        }).catch(function (err) {
            logger.error('Save step error');
            logger.error(err);
        });
    };

    this._runSubstep = function (substep) {

        substep.status = 'RUNNING';
        substep.datetime_start = new Date();
        substep.save().then(function (substep){

            substepServiceDtoMapper.getSubstepServiceDto(substep, function (err, dto) {
                logger.error(dto);
                self.makeRequest(substep, dto);
            });
        }).catch(function (err) {
            logger.error('Save step error');
            logger.error(err);
        });
    };

    this.makeRequest = function (substep, dto){
        //execute service
        apiService.makeRequest(dto, function (err, response) {
            logger.debug(response);
            self.handleResponse(substep, dto, response);
        });

    };

    this.recheckRequest = function () {
        //todo
    };

    this.handleResponse = function (substep, dto, response){

        if(response.response.message == 'OK'){
               self.finishSubstepRequest(substep, dto, response);
        } else {
            logger.error('TODO:: Not OK');
        }
    };

    this.finishSubstepRequest = function (substep, dto, response) {
        var fileKeys =  response.response.data.files;
        async.eachSeries(fileKeys, function iterator(fileKey, callback) {

            var outputPath = __base + substep.id;
            var requestSessionId = response.response.serviceId;

            apiService.loadRequestResponse(dto, requestSessionId, fileKey, outputPath, function (err) {
                callback(err);
            });
        }, function done(err) {
            logger.error('Done');
            //todo goto next request or finish with that
        });
    };





//************
    self.finishWorkflow = function (status, cb) {
        workflow.status = status;
        workflow.datetime_end = new Date();
        workflow.save().then(function (updatedWorkflow) {
            workflow = updatedWorkflow;
            logger.info('Workflow id:'+updatedWorkflow.id+' finished with status: ' + workflow.status);
            cb(null, workflow);
        }).catch(function (err) {
            cb(err);
        });
    }
}

module.exports = Runner;