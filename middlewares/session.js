/**
 * Created by priit on 3.06.15.
 */

module.exports = function (req, res, next) {
    console.log('Session middleware');
    console.log(req.session);
    /*if (!req.session) {
        res.status(401).end();
    }*/
    next(); // otherwise continue
};
