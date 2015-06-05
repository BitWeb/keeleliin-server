/**
 * Created by priit on 2.06.15.
 */

var config = require('../../config');
var entuDaoService = require('./dao/entu/daoService');
var randomString = require('randomstring');

function UserService() {

    this.getAuthUrl = function (request, redirectUrl, callbac) {

        var state = randomString.generate('20');
        var postData = {
            state: state,
            redirect_url: redirectUrl
        };

        request.session.state = state;

        entuDaoService.getAuthUrl(postData, function (error, url) {
            if(error){
                return callbac(error);
            }
            request.session.authUrl = url;
            return callbac(null, url);
        });
    };

    this.getEntuUser = function (request, callbac) {

        entuDaoService.getUser(request.session.authUrl, request.session.state, function (error, userResult) {
            if(error){
                return callbac(error);
            }
            request.session.user = userResult.result.user;
            return callbac(null, userResult.result.user);
        });
    };

    this.logout = function (request, callback) {
        delete request.session.user;
        delete request.session.state;
        delete request.session.authUrl;
        callback();
    };

    this.getEntuEntities = function (request, callbac) {

        var data = {
            limit:10
        };

        var user = request.session.user;
        var meta = {
            userId: user.user_id,
            sessionKey: user.session_key, //entu-api-key
            apiKey: null //ENTU api key for sig
        };

        entuDaoService.getEntities(data, meta, function (error, entities) {
            return callbac(error, entities);
        });
    };
}

module.exports = new UserService();