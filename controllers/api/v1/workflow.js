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
    workflowService.getWorkflow(req, req.params.workflowId, function(err, workflow) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflow);
    });
});

router.get('/projectId/:projectId', function(req, res) {

    workflowService.getWorkflowsByProjectId(req, req.params.projectId, function(err, workflows) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflows);
    });
});

router.get('/service/:workflowServiceId/params', function(req, res) {

    workflowService.getWorkflowServiceParamValues(req, req.params.workflowServiceId, function(err, workflowServiceParamValues) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflowServiceParamValues);
    });
});

router.post('/', function(req, res) {

    var workflowBuilder = new WorkflowBuilder();
    workflowBuilder.create( req.body, function (err, workflow) {
        if(err) return res.send({errors: err});
        res.send( workflow );
    });
});

router.get('/run/:workflowId', function(req, res) {
    var workflowRunner = new WorkflowRunner();
    workflowRunner.run(req.params.workflowId, function(err, data){
        if(err) return res.status(400).send({errors: err});
        res.send(data);
    });
});

router.get('/check/:workflowId', function(req, res) {
    var workflowRunner = new WorkflowRunner();
    workflowRunner.check(req.params.workflowId, function(err, data){
        if(err) return res.status(400).send({errors: err});
        res.send(data);
    });
});


module.exports = router;