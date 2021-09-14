'use strict';

class Authentication {

    static isAuthenticated(req, res, next) {
        if (!!req.user)
            return next();

        res.redirect('/login');
    }

    static isUnauthenticated(req, res, next) {
        if (!req.user)
            return next();

        res.redirect('/');
    }

    static hasRank(minRank) {
        return function(req, res, next) {

            if(process.env.IS_SETUP === true) {
                return next();
            }

            if(!req.user.Role) {
                return res.redirect('/login');
            }

            if (req.user.Role.permissionLevel >= minRank) {
                return next();
            }

            return res.redirect('/login');
        }
    }

}

module.exports = Authentication;
