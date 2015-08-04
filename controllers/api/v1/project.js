/**
 * Created by priit on 9.06.15.
 */
var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('project_controller');
var workflowService = require(__base + 'src/service/workflowService');

var projectService = require('../../../src/service/projectService');

router.get('/', function(req, res) {

    projectService.getCurrentUserProjectsList(req, function (err, projects) {
        return res.sendApiResponse(req, res, err, projects);
    });
});

router.get('/:id', function(req, res) {

    projectService.getCurrentUserProject(req, req.params.id, function (error, project) {
        if(!project){
            res.status(404);
            return res.sendApiResponse(req, res, error, project);
        }
        return res.sendApiResponse(req, res, error, project);
    });
});

router.put('/:id', function(req, res) {

    projectService.updateCurrentUserProject(req, req.params.id, req.body, function (error, project) {
        if(error && !project){
            res.status(404);
            return res.sendApiResponse(req, res, error, project);
        }
        return res.sendApiResponse(req, res, error, project);
    });
});

router.post('/', function(req, res) {

    projectService.createCurrentUserProject(req, req.body, function (error, project) {
        return res.sendApiResponse(req, res, error, project);
    });
});

router.delete('/:id', function(req, res) {

    projectService.deleteCurrentUserProject(req, req.params.id, function (error) {
        if(error){
            res.status(400);
        }
        return res.sendApiResponse(req, res, error);
    });
});

router.get('/:projectId/workflows', function(req, res) {

    workflowService.getProjectWorkflowsList(req, req.params.projectId, function(error, workflows) {
        return res.sendApiResponse(req, res, error, workflows);
    });
});

module.exports = router;
