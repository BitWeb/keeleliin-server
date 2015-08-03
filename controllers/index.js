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




    WorkflowServiceSubstep.find({
        where:{id: 1}
    }).then(function(workflowSubstep) {

        logger.trace(workflowSubstep);

        workflowSubstep.getWorkflowService().then(function (item) {

            if(!item){
                return logger.error(' getWorkflowService not found ');
            }
            return logger.error(' getWorkflowService found ');
        }).catch(function (err) {
            return logger.error('Some error', err);
        });

    }).catch(function (err) {
        return logger.error('Some error', err);
    });


res.send('asd');
    return;



    var WorkflowBuilder = require('./../src/service/workflow/workflowBuilder');
    var Runner = require('./../src/service/workflow/workflowRunner');
    ////////////
    var workflowRunner;
    var initData = {
        "projectId": 1,
        "workflowDefinitionId": 1,
        "resources": [85]
    };

    var counter = 3;


    createWorkflow(initData, function (err, wf) {
        runWorkflow(wf, function (err, data) {
            logger.trace(data.id);
            logger.info('returned to user');

            handleRunCallback(data, function (err, data) {

                if(err){ logger.error( err ); }
                logger.trace(data.id);
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
        logger.trace(data.id);


        if(data.status == 'RUNNING' && counter > 0){
            counter--;
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
