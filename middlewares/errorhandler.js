var logger = require('log4js').getLogger('error_handler_middleware');

module.exports = {
    common: function(err, req, res, next) {

        logger.error('Error 500 happened', err);
        res.status(err.status || 500);
        res.send({
            data: null,
            errors: err.message,
            statusCode: res.statusCode
        });
    },

    error404: function(req, res, next) {

        logger.debug('Error 404 happened');
        res.status(404);
        res.send({
            data: null,
            errors: 'Lehekülge ei leitud',
            statusCode: res.statusCode
        });
    }
};