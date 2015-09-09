/**
 * Created by taivo on 4.08.15.
 */
var logger = require('log4js').getLogger('api_response_middleware');

module.exports = function(req, res, next) {
    res.sendApiResponse = function( err, data ) {
        data = data || null;
        err = err || null;

        var errorMessage = null,
            statusCode = null;

        if (err) {
            errorMessage = (err.message !== undefined ? err.message : err);
            statusCode = (err.code ? err.code : null);
            if(res.statusCode == 200){
                statusCode = 520;
            }
        }

        if(statusCode == null){
            statusCode = res.statusCode
        }

        res.status(statusCode);

        res.send({
            data: data,
            errors: errorMessage,
            statusCode: statusCode
        });
    };

    next();
};