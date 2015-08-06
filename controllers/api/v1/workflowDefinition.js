/**
 * Created by taivo on 12.06.15.
 */

var express = require('express');
var router = express.Router();
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');

router.get('/:workflowDefinitionId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinition(req, req.params.workflowDefinitionId, function(err, workflowDefinition) {
        if (!workflowDefinition) {
            res.status(404);
        }
        return res.sendApiResponse( err, workflowDefinition);
    });
});

router.get('/projectId/:projectId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionsByProject(req, req.params.projectId, function(err, workflowDefinitions) {
        return res.sendApiResponse( err, workflowDefinitions);
    });
});

router.get('/service/:workflowDefinitionServiceId/params', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionServiceParamValues(req, req.params.workflowDefinitionServiceId, function(err, workflowDefinitionServiceParamValues) {
        return res.sendApiResponse( err, workflowDefinitionServiceParamValues);
    });
});

router.post('/projectId/:projectId', function(req, res) {
    workflowDefinitionService.createWorkflowDefinition(req, req.params.projectId, req.body, function(err, workflowDefinion) {
        return res.sendApiResponse( err, workflowDefinion);
    });
});

router.put('/:workflowDefinitionId', function(req, res) {

    return workflowDefinitionService.saveWorkflowDefinition(req, req.params.workflowDefinitionId, req.body, function(err, workflowDefinition) {
        return res.sendApiResponse( err, workflowDefinitionServiceModel);
    });
});

router.get('/service/:workflowDefinitionServiceId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionServiceId, function(err, workflowDefinitionServiceModel) {
        if (!workflowDefinitionServiceModel) {
            res.status(404);
        }
        return res.sendApiResponse( err, workflowDefinitionServiceModel);
    });
});

router.post('/:workflowDefinitionId/service', function(req, res) {

    workflowDefinitionService.createWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionId, req.body, function(err, workflowDefinitionServiceModel) {
        return res.sendApiResponse( err, workflowDefinitionServiceModel);
    });
});

router.delete('/service/:workflowDefinitionServiceId', function(req, res) {

    workflowDefinitionService.removeWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionServiceId, function(err) {
        return res.sendApiResponse( err );
    });
});

router.post('/:workflowDefinitionId/sort', function(req, res) {

    workflowDefinitionService.sortWorkflowDefinitionServices(req, req.body.idsString, function(err) {
        return res.sendApiResponse( err );
    });
});

module.exports = router;