/**
 * Created by priit on 9.06.15.
 */

var logger = require('log4js').getLogger('user_dao_service');

var entuDaoService = require('../dao/entu/daoService');
var User = require(__base + 'src/service/dao/sql').User;

function UserDaoService() {

    this.getAuthUrl = function (postData, callbac) {
        entuDaoService.getAuthUrl(postData, function (error, url) {
            return callbac(error, url);
        });
    };

    this.getEntuUser = function (authUrl, token, callbac) {

        return entuDaoService.getUser(authUrl, token, function (error, userResult) {
            if(error){
                logger.error('getUser Error');
                logger.error(error);
                return callbac(error);
            }
            if(userResult.error){
                logger.error('getUser Error');
                logger.error(userResult);
                return callbac(userResult);
            }

            return callbac(null, userResult.result.user);
        });
    };

    this.getUserByEntuId = function (id, callback) {
        User.find({where:{entu_id:id}}).then(function (user) {
            callback(null, user);
        });
    };

    this.findById = function (id, callback) {
        User.find({where:{id:id}}).then(function (user) {
            callback(user);
        });
    };

    this.create = function (params, callback) {
        User.create(params).then(function (user) {
            callback(user);
        });
    };
}

module.exports = new UserDaoService();