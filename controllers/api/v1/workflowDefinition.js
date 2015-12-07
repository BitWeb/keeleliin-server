var express = require('express');
var router = express.Router();
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Uue töövoo lisamine
 */
router.get('/', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.getCurrentUserWorkflowDefinitionsList(req, req.params, function(err, workflowDefinitions) {
        return res.sendApiResponse( err, workflowDefinitions);
    });
});

/**
 * Töövoogude haldus
 */
router.get('/management-list', authMiddleware('admin'), function(req, res) {
    workflowDefinitionService.getWorkflowDefinitionsManagementList(req, req.query, function(err, data) {
        return res.sendApiResponse( err, data);
    });
});

/**
 * Avaliku urli vaade
 */
router.get('/:definitionId', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.getWorkflowDefinitionOverview(req, req.params.definitionId, function(err, overview) {
        return res.sendApiResponse( err, overview);
    });
});

/**
 * Definitsiooni sätted
 */
router.put('/:definitionId', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.updateWorkflowDefinitionSettings(req, req.body, function(err, overview) {
        return res.sendApiResponse( err, overview);
    });
});

/**
 * Definitsiooni valik / töövoo vaade
 */
router.put('/:definitionId/toggle-bookmark', authMiddleware('regular'), function(req, res) {
    workflowDefinitionService.toggleWorkflowDefinitionBookmark(req, req.params.definitionId, function(err, status) {
        return res.sendApiResponse( err, status);
    });
});

module.exports = router;