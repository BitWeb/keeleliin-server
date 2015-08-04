/**
 * Created by taivo on 4.08.15.
 */

module.exports = function(req, res, next) {
    res.sendApiResponse = function(req, res, err, data) {
        data = data || null;
        err = err || null;

        res.send({
            data: data,
            errors: err,
            statusCode: res.statusCode
        });
    };
    next();
};