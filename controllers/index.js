/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('index');
var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var resourceService = require('../src/service/resourceService');

var authMiddleware = require(__base + 'middlewares/auth');

router.use('/api/v1/', require(__base + 'controllers/api/v1/index'));

/* GET home page. Service description from config */
router.get('/', authMiddleware('guest'), function(req, res, next) {
    res.send('index', {
        title: 'Hello',
        description: 'Keeleliin server'
    });
});

router.get('/resource/:hash', authMiddleware('guest'), function(req, res) {
    resourceService.getResourceByHash(req, req.params.hash, function(error, resource) {
        if (error || !resource) {
            res.status(404);
            return res.sendApiResponse( 'Resource not found' );
        }
        res.download(config.resources.location + resource.filename, resourceService.getDownloadName(resource));
    });
});



/*
router.get('/generate', authMiddleware('guest'), function(req, res, next) {

    if(req.query["pass"] == "pass"){
        sqlModel.sequelize.sync( { force: true } );
        res.send({
            title: 'Database sync'
        });
    } else {
        res.send({
            title: 'Pass is wrong'
        });
    }
});
*/

module.exports = router;
