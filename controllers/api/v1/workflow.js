/**
 * Created by taivo on 15.06.15.
 */


var express = require('express');
var router = express.Router();
var workflowService = require(__base + 'src/service/workflowService');

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

module.exports = router;