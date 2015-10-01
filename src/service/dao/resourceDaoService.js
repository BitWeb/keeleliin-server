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

        var publicResources = " SELECT " +
            " 'Avalik' as level_0," +
            " null as level_1, " +
            " null as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'public' AS context, " +
            " null::INTEGER as project_id, " +
            " null::INTEGER as workflow_id, " +
            " null::INTEGER as service_id " +
            " FROM resource as resource " +
            " WHERE resource.is_public = TRUE " +
            (query.projectId ?  (" AND FALSE " ) : "") +
            (query.workflowId ?  (" AND FALSE ") : "");

        var sharedResources = " SELECT " +
            " 'Jagatud' as level_0," +
            " null as level_1, " +
            " null as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'shared' AS context, " +
            " null::INTEGER as project_id, " +
            " null::INTEGER as workflow_id, " +
            " null::INTEGER as service_id " +
            " FROM resource AS resource " +
            " LEFT JOIN resource_user AS ru ON ( ru.user_id = " + query.userId + " AND ru.resource_id = resource.id ) " +
            " WHERE ru.user_id IS NOT NULL " +
            (query.projectId ?  (" AND FALSE " ) : "") +
            (query.workflowId ?  (" AND FALSE ") : "");

        //projektile lisatud ressursid, mis ei ole selles projektis ühegi töövooga seotud
        var projectResourceHasNoWorkflow =  " SELECT " +
            " project.name as level_0, " +
            " null as level_1, " +
            " null as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'project' AS context, " +
            " project.id as project_id, " +
            " null::INTEGER as workflow_id, " +
            " null::INTEGER as service_id " +
            " FROM resource as resource " +
            " JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " JOIN project AS project ON ( phr.project_id = project.id ) " +
            " JOIN project_user AS pu ON ( pu.project_id = project.id AND pu.user_id = " + query.userId + " ) " +
            " WHERE " +
            " NOT EXISTS (SELECT workflow.id FROM " +
            "   workflow " +
            "   LEFT JOIN workflow_has_input_resource AS workflow_hir ON ( workflow_hir.workflow_id = workflow.id AND workflow_hir.resource_id = resource.id )" +
            "   LEFT JOIN workflow_service AS ws ON ( ws.workflow_id = workflow.id ) " +
            "   LEFT JOIN workflow_service_substep AS wss ON ( wss.workflow_service_id = ws.id )" +
            "   LEFT JOIN workflow_service_substep_has_input_resource AS wss_hir ON (wss_hir.workflow_service_substep_id = wss.id AND wss_hir.resource_id = resource.id )" +
            "   WHERE workflow.project_id = project.id AND " +
            "       ( workflow_hir.resource_id IS NOT NULL OR wss_hir.resource_id IS NOT NULL OR wss.id = resource.workflow_service_substep_id ) " +
            " ) " +
            "  " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ? " AND FALSE " : "") +
            " GROUP BY resource.id, project.id " ;


        //töövoo sisend
        var workflowInputResources = " SELECT " +
            " project.name as level_0, " +
            " workflow.name as level_1, " +
            " null as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'input' AS context, " +
            " project.id as project_id, " +
            " workflow.id as workflow_id, " +
            " null::INTEGER as service_id " +
            " FROM resource as resource " +
            " JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " JOIN project AS project ON ( project.id = phr.project_id ) " +
            " JOIN project_user AS pu ON ( pu.project_id = project.id AND pu.user_id = " + query.userId + " ) " +
            " JOIN workflow AS workflow ON ( workflow.project_id = project.id ) " +
            " JOIN workflow_has_input_resource as workflowInput ON (workflowInput.workflow_id = workflow.id AND workflowInput.resource_id = resource.id )" +
            " WHERE workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        //töövoo väljundid
        var resourceIsOutput = " SELECT " +
            " project.name as level_0, " +
            " workflow.name as level_1, " +
            " null as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'output' AS context, " +
            " project.id as project_id, " +
            " workflow.id as workflow_id, " +
            " null::INTEGER as service_id " +
            " FROM resource as resource " +
            " JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " JOIN project AS project ON ( project.id = phr.project_id ) " +
            " JOIN project_user AS pu ON ( pu.project_id = project.id AND pu.user_id = " + query.userId + " ) " +
            " JOIN workflow AS workflow ON ( workflow.project_id = project.id AND workflow.id = resource.workflow_output_id ) " +
            " WHERE workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        //töövoo alamsammude sisendid
        var resourceIsSubInput = " SELECT " +
            " project.name as level_0, " +
            " workflow.name as level_1, " +
            " service.name as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'middle_input' AS context, " +
            " project.id as project_id, " +
            " workflow.id as workflow_id, " +
            " wf_service.id as service_id " +
            " FROM resource as resource " +
            " JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " JOIN project AS project ON ( project.id = phr.project_id ) " +
            " JOIN project_user AS pu ON ( pu.project_id = project.id AND pu.user_id = " + query.userId + " ) " +
            " JOIN workflow AS workflow ON ( workflow.project_id = project.id ) " +
            " JOIN workflow_service AS wf_service ON ( wf_service.workflow_id = workflow.id ) " +
            " JOIN workflow_service_substep as serviceSubstep ON ( serviceSubstep.workflow_service_id = wf_service.id ) " +
            " JOIN workflow_service_substep_has_input_resource AS wsshir ON (wsshir.workflow_service_substep_id = serviceSubstep.id AND wsshir.resource_id = resource.id ) " +
            " JOIN service AS service ON ( wf_service.service_id = service.id ) " +
            " WHERE " +
            " workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");


        //töövoo alamsammude väljundid
        var resourceIsSubOutput = " SELECT " +
            " project.name as level_0, " +
            " workflow.name as level_1, " +
            " service.name as level_2, " +
            " resource.id as id, " +
            " resource.name as name, " +
            " 'middle_output' AS context, " +
            " project.id as project_id, " +
            " workflow.id as workflow_id, " +
            " wf_service.id as service_id " +
            " FROM resource as resource " +
            " JOIN project_has_resource AS phr ON ( phr.resource_id = resource.id ) " +
            " JOIN project AS project ON ( project.id = phr.project_id ) " +
            " JOIN project_user AS pu ON ( pu.project_id = project.id AND pu.user_id = " + query.userId + " ) " +
            " JOIN workflow AS workflow ON ( workflow.project_id = project.id ) " +
            " JOIN workflow_service AS wf_service ON ( wf_service.workflow_id = workflow.id ) " +
            " JOIN workflow_service_substep as serviceSubstep ON ( serviceSubstep.workflow_service_id = wf_service.id AND resource.workflow_service_substep_id = serviceSubstep.id ) " +
            " JOIN service AS service ON ( wf_service.service_id = service.id ) " +
            " WHERE " +
            " workflow.project_id = project.id " +
            (query.projectId ?  (" AND project.id = " + query.projectId ) : "") +
            (query.workflowId ?  (" AND workflow.id = " + query.workflowId ) : "");

        var queries = [];
        queries.push( publicResources );
        queries.push( sharedResources );
        queries.push( projectResourceHasNoWorkflow );
        queries.push( workflowInputResources );
        queries.push( resourceIsOutput );
        queries.push( resourceIsSubInput );
        queries.push( resourceIsSubOutput );

        var totalQuery = " SELECT " +
            " level_0, " +
            " level_1, " +
            " level_2, " +
            " id, " +
            " name, " +
            " context, " +
            " project_id, " +
            " workflow_id, " +
            " service_id " +
            " FROM ( " + queries.join(" UNION ALL ") + " ) as resource; ";

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
