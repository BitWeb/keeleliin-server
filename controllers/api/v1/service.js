/**
 * Created by priit on 8.06.15.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {

    return res.send({
        services: [
            {id:1},
            {id:2}
        ]
    });
});

module.exports = router;
