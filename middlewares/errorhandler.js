/**
 * Created by priit on 27.05.15.
 */

var debug = require('debug')('errorhandler_middleware');

var express = require('express');
var app = express();

module.exports = {
    common: function(err, req, res, next) {
        debug('Error happened');
        debug(err.stack);

        if (app.get('env') === 'development') {
            res.status(err.status || 500);
            return res.send({errors: err.message });
        }

        res.status(err.status || 500);
        return res.send({errors: err.message });
    },

    error404: function(req, res, next) {
        console.error('Error 404 happened');
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
};