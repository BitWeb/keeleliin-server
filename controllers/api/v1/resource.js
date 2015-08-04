/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_controller');
var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');
var fs = require('fs');
var config = require(__base + 'config');

router.get('/', function(req, res) {

    resourceService.getResources(req, function(error, resources) {
        if (error) {
            return res.status(404).send({errors: error});
        }
        return res.send(resources);
    });
});

router.get('/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error || !resource) {
            return res.status(404).send({errors: 'Resource not found'});
        }
        return res.send(resource);
    });
});

router.get('/download/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error || !resource) {
            return res.status(404).send({errors: 'Resource not found'});
        }
        fs.createReadStream(config.resources.location + resource.filename).pipe(res);
    });
});

router.get('/download/concat/:resourceIds', function(req, res) {
    resourceService.getConcatedResourcePath(req, req.params.resourceIds, function(error, concatPath) {
        if (error) {
            return res.status(404).send({errors: error});
        }
        var readStream = fs.createReadStream( concatPath );
        readStream.pipe(res);
        readStream.on('end', function () {
            logger.debug('Remove concated resource');
            fs.unlink(concatPath)
        });
    });
});

router.post('/upload/:projectId?', function(req, res) {
    resourceService.createResource(req, function(err, resource) {
        if (err) {
            return res.send({errors: err});
        }
        return res.send(resource);
    });
});

module.exports = router;