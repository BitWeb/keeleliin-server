/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_controller');
var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');
var fs = require('fs');
var config = require(__base + 'config');

/**
 * Teenuse lisamise vaade
 */
router.get('/types', function(req, res) {
    resourceService.getResourceTypesList(req, function(error, types) {
        return res.sendApiResponse( error, types);
    });
});

/**
 * Kusagil ressursside puus
 */
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

/**
 * Ressursi üleslaadimine
 */
router.post('/upload', function(req, res) {
    resourceService.createResourceFromUpload(req, function(err, resource) {
        return res.sendApiResponse(err, resource);
    });
});

/**
* Ressursside nimekiri
 */
router.get('/', function(req, res) {
    resourceService.getResources(req, function(error, resources) {
        return res.sendApiResponse( error, resources);
    });
});

/**
 * Ressursi info
 */
router.get('/:resourceId', function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

/**
 * Ressursi info vorm
 */
router.put('/:resourceId', function(req, res) {
    resourceService.updateResource(req, req.params.resourceId, req.body, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

/**
 * Ressursi kustutamise vorm
 */
router.delete('/:resourceId', function(req, res) {
    resourceService.deleteResource(req, req.params.resourceId, req.body, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

//todo
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

//todo
router.get('/projectId/:projectId/published', function(req, res) {

    resourceService.getResourcesPublished(req, req.params.projectId, function(err, resources) {
        return res.sendApiResponse(err, resources);
    });
});

module.exports = router;