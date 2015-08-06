/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('user_dao_service');

var User = require(__base + 'src/service/dao/sql').User;

function UserDaoService() {

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
                callback("Not found");
            }
            callback(null, user);
        }).catch(function(error) {
            return callback({
                message: error.message,
                code: 500
            });
        });
    };
}

module.exports = new UserDaoService();