/**
 * Created by taivo on 15.06.15.
 */

var express = require('express');
var router = express.Router();
var serviceService = require(__base + 'src/service/serviceService');

router.get('/', function(req, res) {
    serviceService.getServices(req, function(err, services) {

        return res.sendApiResponse(req, res, err, services);
    });
});

router.get('/:serviceId', function(req, res) {
    serviceService.getService(req ,req.params.serviceId, function(err, service) {
        if (!service) {
            res.status(404);
        }
        return res.sendApiResponse(req, res, err, service);
    });
});

router.post('/', function(req, res) {
    serviceService.createService(req, req.body, function(err, service) {
        if (err) {
            return res.sendApiResponse(req, res, err, service);
        }

        // Get service with persisted data
        serviceService.getService(req, service.id, function(err, service) {
            return res.sendApiResponse(req, res, err, service);
        });
    });
});

router.put('/:serviceId', function(req, res) {
    serviceService.saveService(req, req.params.serviceId, req.body, function(err, service) {
        if (!service) {
            res.status(404);
        }

        if (err) {
            return res.sendApiResponse(req, res, err, service);
        }

        // Get service with persisted data
        serviceService.getService(req, req.params.serviceId, function(err, service) {
            return res.sendApiResponse(req, res, err, service);

        });
    });
});

router.get('/get-dependent-services/:serviceId', function(req, res) {
    serviceService.getDependentServices(req, req.params.serviceId, function(err, services) {
        return res.sendApiResponse(req, res, err, services);
    });
});

module.exports = router;