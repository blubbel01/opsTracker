const db = require('../../models').sequelize;
const Utility = require('../../helpers/utility');
const bcrypt = require('bcrypt');
const auth = require('../../helpers/auth');
const {Op} = require('sequelize');
const saltRounds = 10;

exports.index = async (req, res) => {

    const users = await db.models.User.findAll({
        include: [
            {
                association: "Role"
            }
        ]
    });

    await Promise.all(users.map(async (user) => {
        user.roleName = user.Role ? user.Role.name : "keinen Rang";
        user.allowModify = user.Role ? (req.user.Role.permissionLevel === 5 || req.user.Role.permissionLevel > user.Role.permissionLevel) : true;
        user.isActive = auth.isUserActiveByUserId(user.id);
        return user;
    }));

    res.render("tracker/leader/user/index", {
        title: "Benutzerverwaltung",
        users,
    });
};
exports.show = async (req, res) => {
    const {id} = req.params;
    const user = await db.models.User.findByPk(id);
    if (!user) {
        await req.flash('error', 'Der angegebene Spieler existiert nicht!');
        return res.redirect("/leader/users");
    }

    let whereCondition = {};

    if (req.user.Role.permissionLevel <= 4) {
        whereCondition = {
            permissionLevel: {
                [Op.lt]: req.user.Role.permissionLevel
            }
        };
    }

    const roles = await db.models.Role.findAll({
        where: whereCondition,
    });

    res.render("tracker/leader/user/show", {
        title: `${user.name} bearbeiten`,
        thisUser: user,
        roles
    });
};
exports.update = async (req, res) => {
    const {id} = req.params;
    const {roleId, forumId} = req.body;
    const user = await db.models.User.findByPk(id);
    const role = await db.models.Role.findByPk(roleId);

    if (!role) {
        await req.flash('error', 'Ausgewählter Rang existiert nicht!');
        return res.redirect("/leader/users");
    }

    if (req.user.Role.permissionLevel <= 4) {
        if (role.permissionLevel >= req.user.Role.permissionLevel) {
            await req.flash('error', 'Du kannst nur bis zu deinem eignen Rang setzten!');
            return res.redirect("/leader/users");
        }
    }


    if (user) {
        user.roleId = roleId;
        user.forumId = forumId;
        await user.save();
        await req.flash('success', `Du hast den Spieler ${user.name} erfolgreich bearbeitet!`);
    } else {
        await req.flash('error', 'Der angegebene Spieler existiert nicht!');
    }
    res.redirect("/leader/users");
};
exports.resetPassword = async (req, res) => {
    const {id} = req.params;
    const user = await db.models.User.findByPk(id);
    if (user) {
        const tempPw = Utility.generateRandomString(32);
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(tempPw, salt, async function(err, hash) {
                user.password = hash;
                user.salt = salt;
                await user.save();
                auth.forceLogoutUserByUserId(user.id);
                res.render("tracker/leader/user/newPassword", {
                    title: "Passwort zurücksetzten",
                    userName: user.name,
                    password: tempPw,
                });
            });
        });
    }
};
exports.delete = async (req, res) => {
    const {id} = req.params;
    const user = await db.models.User.findByPk(id);
    if (user) {
        await user.destroy();
        await req.flash('success', `Du hast den Spieler ${user.name} erfolgreich gelöscht!`);
    } else {
        await req.flash('error', 'Der angegebene Spieler existiert nicht!');
    }
    res.redirect("/leader/users");
};
