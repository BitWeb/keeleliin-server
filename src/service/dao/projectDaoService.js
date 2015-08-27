/**
 * Created by priit on 9.06.15.
 */
var logger = require('log4js').getLogger('project_dao_service');
var Project = require(__base + 'src/service/dao/sql').Project;
var User = require(__base + 'src/service/dao/sql').User;
var ProjectUser = require(__base + 'src/service/dao/sql').ProjectUser;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function ProjectDaoService() {

    var self = this;

    var limit = 15;

    this.getUserProjectsList = function (userId, params, cb) {

        var sql = "SELECT " +
            " project.id as id, " +
            " project.name as name, " +
            " project.description as description, " +
            " project.access_status as access_status, " +
            " project.created_at as created_at " +
            " FROM project as project" +
            " LEFT JOIN project_user as pu ON (pu.project_id = project.id)" +
            " ";

        var where = " WHERE project.deleted_at IS NULL " +
            " AND pu.user_id = " + userId + " ";

        if(params.name){
            where += " AND project.name ILIKE '"+ params.name +"%'"
        }

        sql += where;
        sql += " GROUP BY project.id, project.name, project.description, project.access_status, project.created_at ";

        if(params.sort && params.order){
            sql += " ORDER BY project." + params.sort + " " + params.order + " ";
        }

        var countQuery = "SELECT COUNT(id) as total FROM ("+ sql +") as projects;";

        if(params.page){
            sql += " LIMIT "+ limit +" OFFSET " + ((params.page - 1) * limit) + " ";
        }

        sequelize.query( sql, { type: sequelize.QueryTypes.SELECT}).then(function (rows) {
            sequelize.query( countQuery, { type: sequelize.QueryTypes.SELECT}).then(function (countResult) {
                var countRow = countResult.pop();
                return cb(null, { rows: rows, count: countRow['total'] });
            }).catch(function (err) {
                return cb(err.message);
            });
        }).catch(function (err) {
            return cb(err.message);
        });
    };

    this.getUserProject = function (userId, projectId, callback) {
        Project.find({
            attributes: [
                'id',
                'name',
                'description',
                'createdAt',
                'updatedAt',
                'accessStatus'
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
                        'name',
                        'displaypicture'
                    ],
                    required: true
                },
                {
                    model: User,
                    as: 'user',
                    attributes: [
                        'id',
                        'name',
                        'displaypicture'
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