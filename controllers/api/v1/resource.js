/**
 * Created by taivo on 11.06.15.
 */

var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');
var workFlowService = require(__base + 'src/service/workFlowService');

router.get('/', function(req, res) {

    resourceService.getResources(req, function(error, resources) {
        return res.send(resources);
    });
});

router.post('/', function(req, res) {

    resourceService.createResourceFromUpload(req, function(error, resource) {
        if (error) {
            res.send({errors: error});
        }
        return res.send(resource);
    });
});

router.get('/projectId/:projectId', function(req, res) {

    resourceService.getProjectResources(req, req.params.projectId, function(error, resources) {
        if(error){
            return res.status(400).send({errors: 'Resources not found'});
        }
        return res.send(resources);
    });
});

router.get('/test', function(req, res) {

    workFlowService.test(req, function(err, response) {
        if (err) {
            return res.send({errors : err});
        }
        return res.send(response);
    });
});

module.exports = router;