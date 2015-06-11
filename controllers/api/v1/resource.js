/**
 * Created by taivo on 11.06.15.
 */

var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');

router.get('/', function(req, res) {

    resourceService.getResources(req, function(error, resources) {
        return res.send(resources);
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

module.exports = router;