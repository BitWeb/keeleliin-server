/**
 * Created by priit on 9.06.15.
 */
var express = require('express');
var router = express.Router();
var logger = require('log4js').getLogger('project_controller');

var projectService = require('../../../src/service/projectService');

router.get('/', function(req, res, next) {

    projectService.getCurrentUserProjects(req, function (err, projects) {
        return res.send(projects);
    });
});

router.get('/:id', function(req, res, next) {

    projectService.getCurrentUserProject(req, req.params.id, function (error, project) {
        if(error){
            return res.status(400).send({errors: 'Project not found'});
        }
        return res.send(project);
    });
});

router.put('/:id', function(req, res, next) {

    projectService.updateCurrentUserProject(req, req.params.id, req.body, function (error, project) {
        if(error){
            return res.status(400).send({errors: error});
        }
        return res.send(project);
    });
});

router.delete('/:id', function(req, res, next) {

    projectService.deleteCurrentUserProject(req, req.params.id, function (error) {
        if(error){
            return res.status(400).send({errors: error});
        }
        return res.send( { success: true } );
    });
});


module.exports = router;
