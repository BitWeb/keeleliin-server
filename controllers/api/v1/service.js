/**
 * Created by taivo on 15.06.15.
 */

var express = require('express');
var router = express.Router();
var serviceService = require(__base + 'src/service/serviceService');
var config = require(__base + 'config');
var ServiceForm = require(__base + 'src/form/serviceForm');
var authMiddleware = require(__base + 'middlewares/auth');

/**
 * Teenuste grid list
 */
router.get('/', authMiddleware('regular'), function(req, res) {
    serviceService.getServicesList(req, function(err, services) {
        return res.sendApiResponse( err, services);
    });
});

/**
 * Töövoo lisamise teenuste nimekiri
 */
router.get('/detailed', authMiddleware('regular'), function(req, res) {
    serviceService.getServicesDetailedList(req, function(err, services) {
        return res.sendApiResponse( err, services);
    });
});

/**
 * Teenuse muutmise vaade
 */
router.get('/:serviceId', authMiddleware('regular'), function(req, res) {
    serviceService.getServiceEditData(req ,req.params.serviceId, function(err, service) {
        if (!service) {
            res.status(404);
        }
        return res.sendApiResponse( err, service);
    });
});

/**
 * Teenuse lisamise vaade
 */
router.post('/', authMiddleware('quest'), function(req, res) {
    var form = new ServiceForm(req.body);
    if (form.isValid()) {
        serviceService.createService(req, req.body, function(err, service) {
            if (err) {
                return res.sendApiResponse( err, service);
            }

            // Get service with persisted data
            serviceService.getService(req, service.id, function(err, service) {
                return res.sendApiResponse( err, service);
            });
        });
    } else {
        return res.sendApiResponse(form.errors);
    }
});

/**
 * Teenuse muutmise vaade
 */
router.put('/:serviceId', authMiddleware('admin'), function(req, res) {
    var form = new ServiceForm(req.body);
    if (form.isValid()) {
        serviceService.updateService(req, req.params.serviceId, req.body, function(err, responseData) {
            return res.sendApiResponse( err, responseData);
        });
    } else {
        return res.sendApiResponse(form.errors);
    }
});

/**
 * Teenuste list
 */
router.put('/:serviceId/toggle-status', authMiddleware('admin'), function(req, res) {

    serviceService.toggleServiceStatus(req, req.params.serviceId, function(err, service) {
        return res.sendApiResponse( err, service );
    });
});

//todo ?
router.post('/install/sid/:sid/apiKey/:apiKey', authMiddleware('quest'), function(req, res) {
    if (config.apiKey == req.params.apiKey) {
        serviceService.installService(req, req.params.sid, req.body, function(error, serviceModel) {
            return res.sendApiResponse(error, serviceModel);
        });
    } else {
        return res.sendApiResponse({
            message: 'Api key does not match!',
            code: 401
        });
    }
});

module.exports = router;