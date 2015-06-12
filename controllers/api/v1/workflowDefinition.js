/**
 * Created by taivo on 12.06.15.
 */

var express = require('express');
var router = express.Router();
var workflowDefinitionApiService = require(__base + 'src/service/api/workflowDefinitionApiService');

router.get('/projectId/:projectId', function(req, res) {

    workflowDefinitionApiService.getWorkflowDefinitionsByProject(req, req.params.projectId, function(err, workflowDefinitions) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitions);
    });
});

router.get('/:workflowDefinitionId/services', function(req, res) {

    workflowDefinitionApiService.getWorkflowDefinitionServiceModelsByWorkflowDefinition(req, req.params.workflowDefinitionId, function(err, workflowDefinitionServiceModels) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(workflowDefinitionServiceModels);
    });

});

module.exports = router;