/**
 * Created by taivo on 15.06.15.
 */

var express = require('express');
var router = express.Router();
var resourceTypeService = require(__base + 'src/service/resourceTypeService');
var config = require(__base + 'config');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Ressursi tüüpide grid list & teenuse lisamise vaade & info vaade
 */
router.get('/', authMiddleware('regular'), function(req, res) {
    resourceTypeService.getResourceTypesList(req, function(err, data) {
        return res.sendApiResponse( err, data);
    });
});

/**
 * Ressursi tüübi muutmise vaade
 */
router.get('/:id', authMiddleware('admin'), function(req, res) {
    resourceTypeService.getResourceTypeOverview(req ,req.params.id, function(err, item) {
        if (!item) {
            res.status(404);
        }
        return res.sendApiResponse( err, item);
    });
});

/**
 * Ressursi tüübi lisamise vaade
 */
router.post('/', authMiddleware('admin'), function(req, res) {
    resourceTypeService.addResourceType(req, req.body, function(err, item) {
        return res.sendApiResponse( err, item);
    });
});

/**
 * Ressursi tüübi muutmise vaade
 */
router.put('/:id', authMiddleware('admin'), function(req, res) {
    resourceTypeService.updateResourceType(req, req.params.id, req.body, function(err, item) {
        return res.sendApiResponse( err, item);
    });
});

/**
 * Ressursi tüübi kustutamine
 */
router.delete('/:id', authMiddleware('admin'), function(req, res) {
    resourceTypeService.deleteResourceType(req, req.params.id, function(err) {
        return res.sendApiResponse( err);
    });
});

module.exports = router;