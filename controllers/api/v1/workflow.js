/**
 * Created by taivo on 15.06.15.
 */
var logger = require('log4js').getLogger('workflow_controller');
var express = require('express');
var router = express.Router();
var workflowService = require(__base + 'src/service/workflowService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Uue töövoo loomine
 */
router.post('/create', authMiddleware('regular'), function (req, res) {
    workflowDefinitionService.createNewWorkflow(req, req.body, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

/**
 * Uue töövoo defineerimine
 */
router.post('/define', authMiddleware('regular'), function (req, res) {
    workflowDefinitionService.defineNewWorkflow(req, req.body, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

/**
 * Töövoogude haldus
 */
router.get('/management-list', authMiddleware('admin'), function(req, res) {
    workflowService.getWorkflowsManagementList(req, req.query, function(err, data) {
        return res.sendApiResponse( err, data);
    });
});

/**
 * Töövoo vaade
 */
router.get('/:workflowId', authMiddleware('regular'), function(req, res) {
    workflowService.getWorkflowOverview(req, req.params.workflowId, function(err, overview) {
        return res.sendApiResponse( err, overview);
    });
});

/**
 * Töövoo vaade
 */
router.delete('/:workflowId', authMiddleware('regular'), function(req, res) {
    workflowService.deleteWorkflow(req, req.params.workflowId, function(err, data) {
        return res.sendApiResponse( err, data);
    });
});

/**
 * Definitsiooni lisamise vaade
 */
router.get('/:workflowId/definition', authMiddleware('regular'), function(req, res) {
    workflowService.getWorkflowDefinitionOverview(req, req.params.workflowId, function(err, overview) {
        return res.sendApiResponse( err, overview);
    });
});

/**
 * Definitsiooni teenuste uuendamine
 */
router.put('/:workflowId/definition/services', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.updateDefinitionServices(req, req.params.workflowId, req.body, function(err, overview) {
        return res.sendApiResponse( err, overview);
    });
});

/**
 * Käivitab töövoo
 */
router.put('/:workflowId/run', authMiddleware('regular'), function(req, res) {
    workflowService.runWorkflow(req, req.params.workflowId, function (err, data) {
        return res.sendApiResponse( err, data);
    });
});

/**
 * Katkestab töövoo
 */
router.put('/:workflowId/cancel', authMiddleware('regular'), function(req, res) {
    workflowService.setWorkflowStatusCanceled(req, req.params.workflowId, function(err, workflow) {
        return res.sendApiResponse( err, workflow);
    });
});

/**
 * Sättete modali sisu
 */
router.get('/:workflowId/settings', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.getWorkflowSettings(req, req.params.workflowId, function(err, settings) {
        return res.sendApiResponse( err, settings);
    });
});

/**
 * Sättete uuendamine
 */
router.put('/:workflowId/settings', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.updateWorkflowSettings(req, req.params.workflowId, req.body, function(err, settings) {
        return res.sendApiResponse( err, settings);
    });
});

/**
 * Olemasolevate ressurside lisamine
 */
router.put('/:workflowId/add-resources', authMiddleware('regular'), function(req, res) {
    workflowService.addResources(req, req.params.workflowId, req.body, function(err, data) {
        return res.sendApiResponse( err, data );
    });
});

module.exports = router;