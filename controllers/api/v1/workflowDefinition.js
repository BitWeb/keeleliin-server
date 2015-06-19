/**
 * Created by taivo on 12.06.15.
 */

var express = require('express');
var router = express.Router();
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');

router.get('/:workflowDefinitionId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinition(req, req.params.workflowDefinitionId, function(err, workflowDefinition) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinition);
    });
});

router.get('/projectId/:projectId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionsByProject(req, req.params.projectId, function(err, workflowDefinitions) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitions);
    });
});

router.get('/service/:workflowDefinitionServiceId/params', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionServiceParamValues(req, req.params.workflowDefinitionServiceId, function(err, workflowDefinitionServiceParamValues) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitionServiceParamValues);
    });

});

module.exports = router;