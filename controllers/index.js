/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('index');
var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var sqlModel = require(__base + 'src/service/dao/sql');
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var authMiddleware = require(__base + 'middlewares/auth');

router.use('/api/v1/', require(__base + 'controllers/api/v1/index'));

/* GET home page. Service description from config */
router.get('/', authMiddleware('guest'), function(req, res, next) {
    res.send('index', {
        title: 'Hello',
        description: 'Keeleliin server'
    });
});

router.get('/generate', authMiddleware('guest'), function(req, res, next) {

    sqlModel.sequelize.sync( { force: true } );
    res.send({
        title: 'Database sync'
    });
});



module.exports = router;
