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
            return res.send(404, {errors: 'Project not found'});
        }
        return res.send(project);
    });
});


module.exports = router;
