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

    return workflowDefinitionService.saveWorkflowDefinition(req, req.params.workflowDefinitionId, req.body, function(err, workflowDefinition) {
        if (err) {
            return res.send(err);
        }

        return res.send({id: workflowDefinition.id, date_updated: workflowDefinition.date_updated});
    });
});

router.get('/service/:workflowDefinitionServiceId', function(req, res) {

    workflowDefinitionService.getWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionServiceId, function(err, workflowDefinitionServiceModel) {
        if (err) {
            return res.send(err);
        }

        return res.send(workflowDefinitionServiceModel);
    });
});

router.post('/:workflowDefinitionId/service', function(req, res) {

    workflowDefinitionService.createWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionId, req.body, function(err, workflowDefinitionServiceModel) {
        if (err) {
            return res.send(err);
        }

        return res.send(workflowDefinitionServiceModel);
    });
});

router.delete('/service/:workflowDefinitionServiceId', function(req, res) {

    workflowDefinitionService.removeWorkflowDefinitionServiceModel(req, req.params.workflowDefinitionServiceId, function(err) {
        if (err) {
            return res.send(err);
        }
        return res.send();
    });
});

router.post('/:workflowDefinitionId/sort', function(req, res) {

    workflowDefinitionService.sortWorkflowDefinitionServices(req, req.body.idsString, function(err) {
        if (err) {
            return res.send(err);
        }
        return res.send();
    });
});

module.exports = router;