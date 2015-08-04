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
        return res.sendApiResponse(req, res, error, resources);
    });
});

router.get('/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        return res.sendApiResponse(req, res, error, resource);
    });
});

router.get('/download/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error || !resource) {
            res.status(404);
            return sendApiResponse(req, res, 'Resource not found', resource);
        }
        fs.createReadStream(config.resources.location + resource.filename).pipe(res);
    });
});

router.get('/download/concat/:resourceIds', function(req, res) {
    resourceService.getConcatedResourcePath(req, req.params.resourceIds, function(error, concatPath) {
        if (error) {
            res.status(404);
            return sendApiResponse(req, res, error);
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