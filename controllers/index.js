/**
 * Created by priit on 2.06.15.
 */
var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var sqlModel = require(__base + 'src/service/dao/sql');

router.use('/api/v1/', require(__base + 'controllers/api/v1/index'));


router.use('/user', function(req, res, next){ console.log('USER MIDDLE'); next()}, require('./user'));
router.use('/service', require('./service'));

/* GET home page. Service description from config */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Hello',
        description: 'WORLD'
    });
});

router.get('/generate', function(req, res, next) {
    //
    sqlModel.sequelize.sync({ force: true });
    res.send({
        title: 'Database sync'
    });
});

module.exports = router;
