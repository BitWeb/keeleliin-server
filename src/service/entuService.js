/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('entu_service');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var Project = require(__base + 'src/service/dao/sql').Project;
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var async = require('async');
var config = require(__base + 'config');
var sequelize = require(__base + 'src/service/dao/sql').sequelize;
var entuDaoService = require('./dao/entu/daoService');

function EntuService() {

    var self = this;

    this.getResourcesList = function ( req, cb ) {

        var entuMeta = {
            userId: req.redisSession.data.entuUserId,
            sessionKey: req.redisSession.data.entuSessionKey
        };

        async.waterfall(
            [
                function getEntitiesList( callback ) {
                    var params = {
                        definition: 'resource'
                    };

                    entuDaoService.getEntities( params, entuMeta, function (err, data) {
                        if(err){
                            return callback(err);
                        }
                        callback(err, data.result)
                    });
                },
                function mapRootNodes( entities, callback) {
                    var list = [];
                    for(i in entities){
                        var item = entities[i];
                        list.push({
                            id: item.id,
                            name: item.name,
                            scope: 'entity'
                        })
                    }

                    callback(null, list);
                },
                function (rootNodes, callback) {

                    async.map(
                        rootNodes,
                        function (node, innerCb) {
                            entuDaoService.getEntity( node.id, entuMeta, function (err, data) {
                                if(err){
                                    return callback(err);
                                }

                                node.children = [];
                                var entity = data.result;
                                if(!entity.properties.file){
                                    return innerCb( null, node);
                                }
                                var files = entity.properties.file.values;
                                for(i in files){
                                    node.children.push({
                                        id: files[i].db_value,
                                        name: files[i].value,
                                        scope: 'file'
                                    });
                                }
                                innerCb( null, node);
                            });
                        },
                        function (err, map) {
                            callback( err, map );
                        }
                    );
                }
            ],
            function (err, list) {
                if(err){
                    logger.error(err);
                }
                cb(err, list);
            }
        );
    };

    this.downloadFile = function( fileId, path, entuMeta, cb){
        entuDaoService.downloadFile( fileId, path, entuMeta, cb);
    }
}

module.exports = new EntuService();