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

module.exports = router;