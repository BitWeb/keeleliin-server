/**
 * Created by priit on 8.06.15.
 */
module.exports = function(req, res, next){

    if(req.session == undefined){
        req.session = {};
    }

    console.log('Debug session');
    console.log(req.redisSession.data);
    next();
};