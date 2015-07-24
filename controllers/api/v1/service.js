/**
 * Created by taivo on 15.06.15.
 */

var express = require('express');
var router = express.Router();
var serviceService = require(__base + 'src/service/serviceService');

router.get('/', function(req, res) {
    serviceService.getServices(req, function(err, services) {
        if (err) {
            return res.send(err);
        }
        return res.send(services);
    });
});

router.get('/:serviceId', function(req, res) {
    serviceService.getService(req ,req.params.serviceId, function(err, service) {
        if (err) {
            return res.send(err);
        }
        return res.send(service);
    });
});

router.post('/', function(req, res) {
    serviceService.createService(req, req.body, function(err, service) {
        if (err) {
            return res.send(err);
        }

        // Get service with persisted data
        serviceService.getService(req, service.id, function(err, service) {
            if (err) {
                return res.send(err);
            }
            return res.send(service);
        });
    });
});

router.put('/:serviceId', function(req, res) {
    serviceService.saveService(req, req.params.serviceId, req.body, function(err, service) {
        if (err) {
            return res.send(err);
        }

        // Get service with persisted data
        serviceService.getService(req, req.params.serviceId, function(err, service) {
            if (err) {
                return res.send(err);
            }

            return res.send(service);

        });
    });
});

router.get('/get-dependent-services/:serviceId', function(req, res) {
    serviceService.getDependentServices(req, req.params.serviceId, function(err, services) {
        if (err) {
            return res.send(err);
        }
        return res.send(services);
    });
});

module.exports = router;