/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('workflow_controller');
var express = require('express');
var router = express.Router();
var workflowService = require(__base + 'src/service/workflowService');

var WorkflowBuilder = require('./../../../src/service/workflow/workflowBuilder');
var WorkflowRunner = require('./../../../src/service/workflow/workflowRunner');

router.get('/:workflowId', function(req, res) {
    workflowService.getWorkflowOverview(req, req.params.workflowId, function(err, overview) {
        if (err) return res.status(403).send({errors: err});
        return res.send(overview);
    });
});

router.put('/:workflowId/cancel', function(req, res) {
    workflowService.setWorkflowStatusCanceled(req, req.params.workflowId, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

router.get('/service/:workflowServiceId/params', function(req, res) {

    workflowService.getWorkflowServiceParamValues(req, req.params.workflowServiceId, function(err, workflowServiceParamValues) {

        return res.sendApiResponse( err, workflowServiceParamValues);
    });
});

router.post('/', function(req, res) {
    var workflowBuilder = new WorkflowBuilder();
    workflowBuilder.create( req.body, function (err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

router.get('/:workflowId/run', function(req, res) {
    var workflowRunner = new WorkflowRunner();
    workflowRunner.run(req.params.workflowId, function(err, data){
        if(err){
            res.status(403);
        }
        return res.sendApiResponse( err, data);
    });
});

module.exports = router;