const db = require('../models').sequelize;
const auth = require('./auth');

module.exports = () => {
    return async function (req, res, next) {
        res.locals.req = req;

        res.locals.isAuthenticated = function () {
            return !!auth.getUser(req.session.id);
        };

        res.locals.isUnauthenticated = function () {
            return !auth.getUser(req.session.id);
        };

        res.locals.env = process.env;

        if (auth.getUser(req.session.id)) {
            req.user = await db.models.User.findByPk(auth.getUser(req.session.id), {
                include: [
                    {
                        association: "Role"
                    }
                ]
            });

            if (!req.user.Role) {
                req.user.Role = {
                    permissionLevel: -1,
                    name: "",
                    id: -1,
                }
            }

            if (process.env.IS_SETUP) {
                req.user.Role = {
                    permissionLevel: 5,
                    name: "IS_SETUP",
                    id: -1,
                }
            }
        }

        res.locals.account = req.user;
        res.locals.message = {
            info: await req.consumeFlash('info'),
            error: await req.consumeFlash('error'),
            success: await req.consumeFlash('success'),
        }
        res.locals.yearNow = new Date(Date.now()).getFullYear();
        next();
    };
};
