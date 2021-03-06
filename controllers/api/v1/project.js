/**
 * Created by priit on 9.06.15.
 */
var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('project_controller');
var workflowService = require(__base + 'src/service/workflowService');
var workflowDefinitionService = require(__base + 'src/service/workflowDefinitionService');
var projectService = require('../../../src/service/projectService');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Kasutaja projektide nimekiri
 */
router.get('/', authMiddleware('regular'), function(req, res) {

    projectService.getCurrentUserProjectsList(req, function (err, projects) {
        return res.sendApiResponse(err, projects);
    });
});

/**
 * Projekti vaade
 */
router.get('/:id', authMiddleware('regular'), function(req, res) {

    projectService.getCurrentUserProject(req, req.params.id, function (error, project) {
        if(!project){
            res.status(404);
            return res.sendApiResponse(error, project);
        }
        return res.sendApiResponse(error, project);
    });
});

/**
 * Projekti sättete muutmine
 */
router.put('/:id', authMiddleware('regular'), function(req, res) {
    projectService.updateCurrentUserProject(req, req.params.id, req.body, function (error, project) {
        if(error && !project){
            res.status(404);
            return res.sendApiResponse(error, project);
        }
        return res.sendApiResponse(error, project);
    });
});

/**
 * Uue projekti lisamine
 */
router.post('/', authMiddleware('regular'), function(req, res) {
    projectService.createCurrentUserProject(req, req.body, function (error, project) {
        return res.sendApiResponse(error, project);
    });
});

/**
 * Projekti kustutamine
 */
router.delete('/:id', authMiddleware('regular'), function(req, res) {
    projectService.deleteCurrentUserProject(req, req.params.id, function (error) {
        if(error){
            res.status(400);
        }
        return res.sendApiResponse(error);
    });
});

/**
 * Projekti vaate töövoogude nimekiri
 */
router.get('/:projectId/workflows', authMiddleware('regular'), function(req, res) {
    workflowService.getProjectWorkflowsList(req, req.params.projectId, function(error, workflows) {
        return res.sendApiResponse(error, workflows);
    });
});

/**
 * Projekti vaate töövoo kirjelduste nimekiri
 */
router.get('/:projectId/definitions', authMiddleware('regular'), function(req, res) {

    workflowDefinitionService.getProjectWorkflowDefinitionsList(req, req.params.projectId, function(error, definitions) {
        return res.sendApiResponse(error, definitions);
    });
});

module.exports = router;
