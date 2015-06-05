/**
 * Created by priit on 4.06.15.
 */
var express = require('express');
var router = express.Router();

var sqlModel = require(__base + 'src/service/dao/sql');

router.get('/', function(req, res, next) {

    sqlModel.Service.findAll({where:{}}).then(function (data) {
        res.send( data );
    });

});

router.get('/:id', function(req, res, next) {



        sqlModel.Service.find({ where:{id:req.params.id}}).then(function (data) {


            res.send( data );

            data.getParents().then(function (resp) {
                //res.send( resp );
            });
        });






});

module.exports = router;
