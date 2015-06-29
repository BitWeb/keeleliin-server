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
        return res.send(service);
    });
});

module.exports = router;