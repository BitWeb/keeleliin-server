/**
 * Created by priit on 2.06.15.
 */
var express = require('express');
var router = express.Router();
var config = require(__base + 'config');
var sqlModel = require(__base + 'src/service/dao/sql');

router.use('/api/v1/', require(__base + 'controllers/api/v1/index'));

/* GET home page. Service description from config */
router.get('/', function(req, res, next) {
    res.send('index', {
        title: 'Hello',
        description: 'Keeleliin server'
    });
});

router.get('/generate', function(req, res, next) {
    sqlModel.sequelize.sync( { force: true } );
    res.send({
        title: 'Database sync'
    });
});

router.get('/test', function(req, res, next) {
    var WorkflowBuilder = require('./../src/service/workflow/workflowBuilder');
    var workflowBuilder = new WorkflowBuilder();
    workflowBuilder.create( 1, 1, [1,2], function (err, data) {
        if(err) return res.send(err);
        res.send(data);
    });
});



module.exports = router;
