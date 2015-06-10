/**
 * Created by priit on 9.06.15.
 */
var logger = require('log4js').getLogger('project_dao_service');
var Project = require(__base + 'src/service/dao/sql').Project;

function ProjectDaoService() {

    this.getUserProjects = function (userId, callback) {

        Project.findAll({where: {user_id: userId}}).then(function (result) {
            return callback(null, result);
        });
    };

    this.getUserProject = function (userId, projectId, callback) {

        Project.find({where: { id: projectId, user_id: userId}}).then(function (result) {
            if(!result){
                return callback('Not found');
            }
            return callback(null, result);
        });
    }
}

module.exports = new ProjectDaoService();