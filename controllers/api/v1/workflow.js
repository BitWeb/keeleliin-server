/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('workflow_controller');
var express = require('express');
var router = express.Router();
var workflowService = require(__base + 'src/service/workflowService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');

/**
 * Uue töövoo defineerimine
 */
router.post('/define', function (req, res) {
    workflowDefinitionService.defineNewWorkflow(req, req.body, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

/**
 * Töövoo vaade
 */
router.get('/:workflowId', function(req, res) {
    workflowService.getWorkflowOverview(req, req.params.workflowId, function(err, overview) {
        if (err) return res.status(403).send({errors: err});
        return res.send(overview);
    });
});

/**
 * Definitsiooni lisamise vaade
 */
router.get('/:workflowId/definition', function(req, res) {
    workflowService.getWorkflowDefinitionOverview(req, req.params.workflowId, function(err, overview) {
        if (err) return res.status(403).send({errors: err});
        return res.send(overview);
    });
});

/**
 * Definitsiooni teenuste uuendamine
 */
router.put('/:workflowId/definition/services', function(req, res) {
    workflowDefinitionService.updateDefinitionServices(req, req.params.workflowId, req.body, function(err, overview) {
        if (err) return res.status(403).send({errors: err});
        return res.send(overview);
    });
});

/**
 * Uue töövoo definitsiooni uuendamine
 */
/*router.put('/:workflowId/update-definition', function (req, res) {
    workflowDefinitionService.updateDefinition(req, req.params.workflowId, req.body, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});*/

/**
 * Käivitab töövoo
 */
router.put('/:workflowId/run', function(req, res) {

    workflowService.runWorkflow(req, req.params.workflowId, function (err, data) {
        if(err){
            res.status(403);
        }
        return res.sendApiResponse( err, data);
    });
});

/**
 * Katkestab töövoo
 */
router.put('/:workflowId/cancel', function(req, res) {
    workflowService.setWorkflowStatusCanceled(req, req.params.workflowId, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

module.exports = router;