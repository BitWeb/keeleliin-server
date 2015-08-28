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
        return res.sendApiResponse( error, resources);
    });
});

router.get('/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

router.get('/download/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error || !resource) {
            res.status(404);
            return res.sendApiResponse( 'Resource not found' );
        }

        res.setHeader('Content-disposition', 'attachment; filename='+resource.name);
        res.download(config.resources.location + resource.filename);
    });
});

router.get('/download/concat/:resourceIds', function(req, res) {
    resourceService.getConcatedResourcePath(req, req.params.resourceIds, function(error, concatPath) {
        if (error) {
            res.status(404);
            return res.sendApiResponse( error);
        }
        res.setHeader('Content-disposition', 'attachment; filename=concat_result');
        var readStream = fs.createReadStream( concatPath );
        readStream.pipe(res);
        readStream.on('end', function () {
            logger.debug('Remove concated resource');
            fs.unlink(concatPath)
        });
    });
});

router.post('/:projectId?', function(req, res) {
    resourceService.createResource(req, function(err, resource) {
        return res.sendApiResponse(err, resource);
    });
});

router.get('/projectId/:projectId/published', function(req, res) {

    resourceService.getResourcesPublished(req, req.params.projectId, function(err, resources) {
        return res.sendApiResponse(err, resources);
    });
});

module.exports = router;