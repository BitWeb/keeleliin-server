/**
 * Created by taivo on 12.06.15.
 */

var express = require('express');
var router = express.Router();
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');

/**
 * Get workflow definitions by project id
 */
router.get('/projectId/:projectId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionsByProject(req, req.params.projectId, function(err, workflowDefinitions) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitions);
    });
});

/**
 * Get workflow definition service params by workflow definition service id
 */
router.get('/service/:workflowDefinitionServiceId/params', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionServiceParamValues(req, req.params.workflowDefinitionServiceId, function(err, workflowDefinitionServiceParamValues) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitionServiceParamValues);
    });

});

module.exports = router;