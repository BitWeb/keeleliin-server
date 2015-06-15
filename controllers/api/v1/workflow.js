/**
 * Created by taivo on 15.06.15.
 */


var express = require('express');
var router = express.Router();
var workflowService = require(__base + 'src/service/workflowService');

/**
 * Get workflow by project id
 */
router.get('/projectId/:projectId', function(req, res) {

    workflowService.getWorkflowsByProjectId(req, req.params.projectId, function(err, workflows) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflows);
    });
});

/**
 * Get workflow service params by workflow service id
 */
router.get('/service/:workflowServiceId/params', function(req, res) {

    workflowService.getWorkflowServiceParamValues(req, req.params.workflowServiceId, function(err, workflowServiceParamValues) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflowServiceParamValues);
    });
});

module.exports = router;