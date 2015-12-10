/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('entu_service');
var fs = require('fs');
var Resource = require(__base + 'src/service/dao/sql').Resource;
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

    this.getResourcesList = function ( req, query, cb ) {

        var entuMeta = {
            userId: req.redisSession.data.entuUserId,
            sessionKey: req.redisSession.data.entuSessionKey
        };

        async.waterfall(
            [
                function getEntitiesList( callback ) {
                    var params = {
                        definition: 'resource',
                        query: query.query
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
                    for(var i = 0, length = entities.length; i < length; i++){
                        var item = entities[i];
                        list.push({
                            id: item.id,
                            name: item.name,
                            scope: 'entity'
                        });
                    }

                    callback(null, list);
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

    this.getResourceFilesList = function ( req, resourceId, cb ) {
        var entuMeta = {
            userId: req.redisSession.data.entuUserId,
            sessionKey: req.redisSession.data.entuSessionKey
        };

        async.waterfall(
            [
             function (callback) {

                 entuDaoService.getEntity(resourceId, entuMeta, function (err, data) {
                     if (err) {
                         return callback(err);
                     }

                     var children = [];
                     var entity = data.result;

                     /**logger.debug(entity);**/

                     if (!entity || !entity.properties.file || !entity.properties.file.values) {
                         return callback(null, children);
                     }

                     var files = entity.properties.file.values;

                     for (var i = 0, length = files.length; i < length; i++) {
                         children.push({
                             id: files[i].db_value,
                             name: files[i].value,
                             scope: 'file'
                         });
                     }

                     entuDaoService.getEntityChilds(resourceId, entuMeta, function (err, data) {
                         if (err) {
                             return callback(err);
                         }
                         var result = data.result;
                         var resource = result.resource;
                         if(!resource){
                            return callback(null, children);
                         }
                         var entities = resource.entities;
                         if(!entities){
                             return callback(null, children);
                         }

                         for(var i = 0, l = entities.length; i < l; i++ ){
                             var entity = entities[i];
                             children.push({
                                 id: entity.id,
                                 name: entity.name,
                                 scope: 'entity'
                             });
                         }

                         logger.debug(children);

                         return callback(null, children);
                     });
                 });
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