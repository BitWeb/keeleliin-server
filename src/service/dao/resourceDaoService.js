/**
 * Created by taivo on 11.06.15.
 */
var logger = require('log4js').getLogger('resource_dao_service');
var Resource = require(__base + 'src/service/dao/sql').Resource;
var Project = require(__base + 'src/service/dao/sql').Project;
var Workflow = require(__base + 'src/service/dao/sql').Workflow;
var WorkflowServiceSubstep = require(__base + 'src/service/dao/sql').WorkflowServiceSubstep;
var WorkflowService = require(__base + 'src/service/dao/sql').WorkflowService;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function ResourceDaoService() {

    this.getResources = function(query, callback) {

/*
        >Avalikud Ressursid
        >Kasutajale Jagatud Ressursid
        Projekt
            >Töövoota Ressursid
            >Töövoog
                >>Sisendressursid
                >>Väljundressursid
                >>Töövoo teenus
                    >>>Sisendressursid
                    >>>Väljundressursid
*/

        var conditions = [];
        if( query.projectId ){
            conditions.push("ra.project_id = " + query.projectId);
        }
        if( query.workflowId ){
            conditions.push("ra.workflow_id = " + query.workflowId);
        }
        if( query.userId ){
            conditions.push("ra.user_id = " + query.userId);
        }

        var where = "";

        if(conditions.length > 0){
            where = " WHERE " + conditions.join(" AND ");
        }

        var totalQuery = " SELECT " +
            " CASE WHEN (ra.context = 'public') THEN 'Avalik' WHEN (ra.context = 'shared') THEN 'Jagatud' ELSE project.name END as level_0, " +
            " workflow.name as level_1, " +
            " service.name as level_2, " +
            " ra.id, " +
            " ra.resource_id, " +
            " resource.name, " +
            " ra.context, " +
            " ra.project_id, " +
            " ra.workflow_id, " +
            " ws.id as service_id " +
            " FROM resource_association as ra " +
            " JOIN resource ON (ra.resource_id = resource.id) " +
            " LEFT JOIN project ON (ra.project_id = project.id)" +
            " LEFT JOIN workflow ON (ra.workflow_id = workflow.id)" +
            " LEFT JOIN workflow_service_substep as ws_substep ON (ra.workflow_service_substep_id = ws_substep.id) " +
            " LEFT JOIN workflow_service as ws ON (ws_substep.workflow_service_id = ws.id)" +
            " LEFT JOIN service ON (ws.service_id = service.id)" +
            "" + where;

        var start = new Date().getTime();
        sequelize.query( totalQuery, { type: sequelize.QueryTypes.SELECT}).then(function (resources) {
            logger.debug('Got resources in : ', new Date().getTime() - start);
            return callback(null, resources);
        }).catch(function (err) {
            logger.error(err.message);
            return callback(err.message);
        });
    };

    this.getResource = function(resourceId, callback) {

        Resource.findById( resourceId ).then(function(resource) {
            if(!resource){
                return callback('Resource not found');
            }
            return callback(null, resource);
        }).catch(function(error) {
            logger.error(error);
            return callback({
                message: error.message,
                code: 500
            });
        });
    };
}

module.exports = new ResourceDaoService();
