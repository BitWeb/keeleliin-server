/**
 * Created by priit on 9.06.15.
 */
var logger = require('log4js').getLogger('project_dao_service');
var Project = require(__base + 'src/service/dao/sql').Project;
var User = require(__base + 'src/service/dao/sql').User;

function ProjectDaoService() {

    this.getUserProjectsList = function (userId, callback) {

        Project.findAll({
            attributes: [
                'id',
                'name',
                'description',
                'createdAt'
            ],
            where: {
                userId: userId
            }
        }).then(function (result) {
            return callback(null, result);
        });
    };

    this.getUserProject = function (userId, projectId, callback) {
        Project.find({
            attributes: [
                'id',
                'name',
                'description',
                'createdAt',
                'updatedAt'
            ],
            where: {
                id: projectId, userId: userId
            },
            include: [{
                model:User,
                as: 'user',
                attributes: [
                    'id',
                    'name'
                ]
            }]
        }).then(function (result) {
            if(!result){
                return callback('Projekti ei leitud');
            }
            return callback(null, result);
        });
    };

    this.getProject = function (projectId, callback) {
        Project.find({
            where: { id: projectId}
        }).then(function (result) {
            if(!result){
                return callback('Projekti ei leitud');
            }
            return callback(null, result);
        });
    }
}

module.exports = new ProjectDaoService();