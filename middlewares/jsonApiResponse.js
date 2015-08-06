/**
 * Created by taivo on 4.08.15.
 */
var logger = require('log4js').getLogger('api_response_middleware');

module.exports = function(req, res, next) {
    res.sendApiResponse = function( err, data ) {
        data = data || null;
        err = err || null;

        var errorMessage = null,
            errorCode = null;

        if (err) {
            errorMessage = (err.message !== undefined ? err.message : err);
            errorCode = (err.code !== undefined ? err.code : res.statusCode);
        }

        res.send({
            data: data,
            errors: errorMessage,
            statusCode: errorCode
        });
    };

    next();
};