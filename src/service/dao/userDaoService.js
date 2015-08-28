/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('user_dao_service');
var User = require(__base + 'src/service/dao/sql').User;
var sequelize = require(__base + 'src/service/dao/sql').sequelize;

function UserDaoService() {

    var self = this;

    this.getUserByEntuId = function (id, callback) {
        User.find({where:{entuId:id}}).then(function (user) {
            callback(null, user);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.findById = function (id, callback) {
        User.find({where:{id:id}}).then(function (user) {
            if(!user){
                return callback("User not found");
            }
            return callback(null, user);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getActiveUsersList = function (pagination, callback) {
        pagination = pagination || {};
        var limit = pagination.limit || null;
        var offset = pagination.offset || null;

        User.findAll({
            where:{},
            attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
            order: [['id', 'ASC']],
            limit: limit,
            offset: offset
        }).then(function (data) {
            return callback(null, data);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };

    this.getUsersWithCount = function(pagination, cb) {
        pagination = pagination || {};
        var sort = pagination.sort || 'id';
        var order = pagination.order || 'ASC';

        var andWhere = {};
        if (pagination.data.name) {
            andWhere['name'] = pagination.data.name;
        }
        if (pagination.data.role) {
            andWhere['role'] = pagination.data.role;
        }

        var q = 'SELECT ' +
            '"user".id, ' +
            '"user".name, ' +
            '"user".email,' +
            '"user".role,' +
            '"user".is_active,' +
            '"user".created_at,' +
            '"user".updated_at FROM "user"';

        if (andWhere.hasOwnProperty('name') || andWhere.hasOwnProperty('role')) {
            q += ' WHERE ';
            for (var key in andWhere) {
                if (andWhere.hasOwnProperty(key)) {
                    var value = andWhere[key];
                    q += "\"user\"." + key + " ILIKE '%" + value + "%' ";
                }
            }
        }

        q += ' ORDER BY "user".' + sort + ' ' + order;

        // Get total count
        var sql = 'SELECT COUNT(userCount.id) as total FROM (' + q + ') as userCount';
        sequelize.query(sql, { type: sequelize.QueryTypes.SELECT}).then(function (result) {
            result = result.pop();
            var totalCount = parseInt((result ? result['total'] : 0));

            // Add limit and offset
            if (pagination.page > 0 && pagination.perPage > 0) {
                q += ' LIMIT ' + pagination.perPage;
                q += ' OFFSET ' + ((pagination.page - 1) * pagination.perPage);
            }

            // Get users per page
            sequelize.query(q, { type: sequelize.QueryTypes.SELECT}).then(function (users) {
                var sql = 'SELECT COUNT(userCount.id) as total FROM (' + q + ') as userCount';

                // Get per page count
                sequelize.query(sql, { type: sequelize.QueryTypes.SELECT}).then(function (result) {
                    result = result.pop();
                    var pageTotal = parseInt((result ? result['total'] : 0));

                    return cb(null, {rows: users, count: pageTotal, totalCount: totalCount});

                }).catch(function (err) {
                    return cb(err.message);
                });

            }).catch(function (err) {
                return cb(err.message);
            });
        }).catch(function (err) {
            return cb(err.message);
        });
    };


}

module.exports = new UserDaoService();