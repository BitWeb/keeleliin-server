/**
 * Created by taivo on 15.06.15.
 */

var express = require('express');
var router = express.Router();
var serviceService = require(__base + 'src/service/serviceService');
var config = require(__base + 'config');
var ServiceForm = require(__base + 'src/form/serviceForm');

router.get('/', function(req, res) {
    serviceService.getServices(req, function(err, services) {

        return res.sendApiResponse( err, services);
    });
});

router.get('/:serviceId', function(req, res) {
    serviceService.getService(req ,req.params.serviceId, function(err, service) {
        if (!service) {
            res.status(404);
        }
        return res.sendApiResponse( err, service);
    });
});

router.post('/', function(req, res) {
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

router.put('/:serviceId', function(req, res) {
    var form = new ServiceForm(req.body);
    if (form.isValid()) {
        serviceService.saveService(req, req.params.serviceId, req.body, function(err, service) {
            if (!service) {
                res.status(404);
            }

            if (err) {
                return res.sendApiResponse( err, service);
            }

            // Get service with persisted data
            serviceService.getService(req, req.params.serviceId, function(err, service) {
                return res.sendApiResponse( err, service);

            });
        });
    } else {
        return res.sendApiResponse(form.errors);
    }
});

router.get('/get-dependent-services/:serviceId', function(req, res) {
    serviceService.getDependentServices(req, req.params.serviceId, function(err, services) {
        return res.sendApiResponse( err, services);
    });
});

router.post('/install/sid/:sid/apiKey/:apiKey', function(req, res) {
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