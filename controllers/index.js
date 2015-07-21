/**
 * Created by priit on 2.06.15.
 */
var logger = require('log4js').getLogger('index');
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
    var Runner = require('./../src/service/workflow/runner');
    ////////////
    var workflowRunner;
    var initData = {
        "project_id": 1,
        "workflow_definition_id": 1,
        "resources": [1,2]
    };

    createWorkflow(initData, function (err, wf) {
        runWorkflow(wf, function (err, data) {
            logger.error(data);
            logger.info('returned to user');

            handleRunCallback(data, function (err, data) {

                if(err){ logger.error( err ); }
                logger.error(data);
                res.send(data);
                logger.error('FINITO');
            });
        })
    });

    function createWorkflow(data, cb){
        var workflowBuilder = new WorkflowBuilder();
        workflowBuilder.create( data, cb);
    }

    function runWorkflow(wf, cb){
        workflowRunner = new Runner();
        workflowRunner.run(wf.id, cb);
    }

    function handleRunCallback(data, cb){
        logger.error(data);


        if(data.status == 'RUNNING'){

            setTimeout(function () {
                logger.error('---------');
                logger.error(data.id);

                workflowRunner.check(data.id, function (err, data) {
                    if(err){ return cb(err); }
                    handleRunCallback(data, cb);
                });
            }, 3000);

        } else {
            cb(null, data);
        }
    }


    ////////////
});



module.exports = router;
