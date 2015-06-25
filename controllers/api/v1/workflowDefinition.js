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

router.post('/projectId/:projectId', function(req, res) {

    workflowDefinitionService.createWorkflowDefinition(req, req.params.projectId, req.body, function(err, workflowDefinion) {
        if (err) {
            return res.send({errors: err});
        }

        return res.send({id: workflowDefinion.id, date_created: workflowDefinion.date_created});
    });
});

router.put('/:workflowDefinitionId', function(req, res) {

    workflowDefinitionService.saveWorkflowDefinition(req, req.params.workflowDefinitionId, req.body, function(err, workflowDefinition) {
        if (err) {
            return res.send({errors: err});
        }

        return res.send({id: workflowDefinition.id, date_updated: workflowDefinition.date_updated});
    });
});

module.exports = router;