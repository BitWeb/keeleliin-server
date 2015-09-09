/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('index');
var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var sqlModel = require(__base + 'src/service/dao/sql');
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;

router.use('/api/v1/', require(__base + 'controllers/api/v1/index'));

/* GET home page. Service description from config */
router.get('/', function(req, res, next) {
    res.send('index', {
        title: 'Hello',
        description: 'Keeleliin server'
    });
});

router.get('/generate', function(req, res, next) {

//    throw new Error('Can not generate');

    sqlModel.sequelize.sync( { force: true } );
    res.send({
        title: 'Database sync'
    });
});

router.get('/test', function(req, res, next) {




});



module.exports = router;
