/**
 * Created by priit on 9.06.15.
 */
var logger = require('log4js').getLogger('project_dao_service');
var Project = require(__base + 'src/service/dao/sql').Project;
var User = require(__base + 'src/service/dao/sql').User;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;

function ProjectDaoService() {

    var self = this;

    var limit = 10;

    this.getUserProjectsList = function (userId, params, cb) {

        var queryProperties = {
            attributes: [
                'id',
                'name',
                'description',
                'accessStatus',
                'createdAt'
            ],
            where: {},
            include: [
                {
                    model: ProjectUser,
                    as: 'projectUserRelations',
                    attributes: [],
                    where: {
                        userId: userId
                    },
                    required: true
                }
            ],
            required: true
        };

        if(params.name){
            queryProperties.where.name = {
                $iLike: params.name + '%'
            }
        }

        if(params.page){
            queryProperties.limit = limit;
            queryProperties.offset = (params.page - 1) * limit;
        }

        if(params.sort && params.order){
            queryProperties.order = [[params.sort, params.order]]
        }

        Project.findAndCountAll( queryProperties ).then(function (result) {
            return cb(null, result);
        }).catch(function (err) {
            cb(err.message);
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
                id: projectId/*, userId: userId*/
            },
            include: [
                {
                    model: User,
                    as: 'projectUsers',
                    attributes: [
                        'id',
                        'name'
                    ],
                    required: true
                },
                {
                    model: ProjectUser,
                    as: 'projectUserRelations',
                    attributes: [],
                    where: {
                        userId: userId
                    },
                    required: true
                }
            ]
        }).then(function (result) {
            if(!result){
                return callback('Projekti ei leitud');
            }
            return callback(null, result);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
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
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    }
}

module.exports = new ProjectDaoService();