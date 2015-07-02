/**
 * Created by taivo on 11.06.15.
 */

var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');
var fs = require('fs');
var config = require(__base + 'config');

router.get('/', function(req, res) {

    resourceService.getResources(req, function(error, resources) {
        return res.send(resources);
    });
});

router.get('/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error) {
            res.send({errors: 'Resource not found'});
        }
        return res.send(resource);
    });
});

router.get('/download/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error) {
            res.send({errors: 'Resource not found'});
        }
        fs.createReadStream(config.resources.location + resource.filename).pipe(res);
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


router.post('/upload/:projectId?', function(req, res) {
    resourceService.createResourceFromUpload(req, function(err, resource) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(resource);
    });
});

module.exports = router;