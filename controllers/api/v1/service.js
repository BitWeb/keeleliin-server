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

module.exports = router;