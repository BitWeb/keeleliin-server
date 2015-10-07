/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_controller');
var express = require('express');
var router = express.Router();
var resourceService = require('../../../src/service/resourceService');
var fs = require('fs');
var config = require(__base + 'config');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Kusagil ressursside puus
 */
router.get('/:resourceId/download', authMiddleware('regular'), function(req, res) {
    resourceService.getResource(req, req.params.resourceId, function(error, resource) {
        if (error || !resource) {
            res.status(404);
            return res.sendApiResponse( 'Resource not found' );
        }

        res.download(config.resources.location + resource.filename, resourceService.getDownloadName(resource));
    });
});

/**
 * Ressursi info
 */
router.get('/:resourceId', authMiddleware('regular'), function(req, res) {
    resourceService.getResourceInfo(req, req.params.resourceId, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

/**
 * Ressursi üleslaadimine
 */
router.post('/upload', authMiddleware('regular'), function(req, res) {
    resourceService.createResourceFromUpload(req, function(err, resource) {
        return res.sendApiResponse(err, resource);
    });
});

/**
* Ressursside nimekiri
 */
router.get('/', authMiddleware('regular'), function(req, res) {
    resourceService.getResources(req, function(error, resources) {
        return res.sendApiResponse( error, resources);
    });
});

/**
 * Ressursi info vorm
 */
router.put('/:resourceId', authMiddleware('regular'), function(req, res) {
    resourceService.updateResource(req, req.params.resourceId, req.body, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

/**
 * Ressursi kustutamise vorm
 */
router.delete('/association/:associationId', authMiddleware('regular'), function(req, res) {
    resourceService.deleteResourceAssociation(req, req.params.associationId, function(error, resource) {
        return res.sendApiResponse( error, resource);
    });
});

//todo
router.get('/download/concat/:resourceIds', authMiddleware('regular'), function(req, res) {
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

module.exports = router;