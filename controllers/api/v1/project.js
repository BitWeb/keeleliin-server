/**
 * Created by priit on 9.06.15.
 */
var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('project_controller');
var workflowService = require(__base + 'src/service/workflowService');

var projectService = require('../../../src/service/projectService');

router.get('/', function(req, res) {

    projectService.getCurrentUserProjects(req, function (err, projects) {
        return res.send(projects);
    });
});

router.get('/:id', function(req, res) {

    projectService.getCurrentUserProject(req, req.params.id, function (error, project) {
        if(error){
            return res.status(400).send({errors: 'Project not found'});
        }
        return res.send(project);
    });
});

router.put('/:id', function(req, res) {

    projectService.updateCurrentUserProject(req, req.params.id, req.body, function (error, project) {
        if(error){
            return res.status(400).send({errors: error});
        }
        return res.send(project);
    });
});

router.post('/', function(req, res) {

    projectService.createCurrentUserProject(req, req.body, function (error, project) {
        if(error){
            return res.status(400).send({errors: error});
        }
        return res.send(project);
    });
});

router.delete('/:id', function(req, res) {

    projectService.deleteCurrentUserProject(req, req.params.id, function (error) {
        if(error){
            return res.status(400).send({errors: error});
        }
        return res.send( { success: true } );
    });
});

router.get('/:projectId/workflows', function(req, res) {

    workflowService.getProjectWorkflowsList(req, req.params.projectId, function(err, workflows) {
        if (err) {
            return res.send(err);
        }
        return res.send(workflows);
    });
});

module.exports = router;
