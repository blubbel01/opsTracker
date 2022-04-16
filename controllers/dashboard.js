const {Op} = require('sequelize');

const {Payment} = require('../helpers/payment');
const bcrypt = require('bcrypt');
const {sequelize: db} = require("../models");
const moment = require("moment");
const saltRounds = 10;

exports.index = async (req, res) => {
    const thisWeekPayment = await Payment.getUserPayment(req.user.id, moment().startOf("week"), moment().endOf("week"));

    const operationType = await db.models.OperationType.findAll({
        include: [
            {
                model: db.models.Operation,
                limit: 50,
            }
        ]
    });

    await Promise.all(operationType.map(async (type) => {
        const maxLast = Date.now() - (type.timeOnDashboard) * 60 * 60 * 1000;
        type.Operations.forEach(op => {
            op.showOnDashboard = op.timestamp.getTime() > maxLast;
        });
        type.Operations = type.Operations.filter((a) => a.showOnDashboard);
        return type;
    }));

    res.render("tracker/index", {
        title: "Dashboard",
        thisWeekPayment,
        operationType,
    });
};

exports.profile = async (req, res) => {
    res.render("tracker/profile", {
        title: "Profil",
    });
};

exports.updatePassword = async (req, res) => {
    const {oldPassword, password1, password2} = req.body;

    const match = await bcrypt.compare(oldPassword, req.user.password);

    if (!match) {
        await req.flash('error', 'Passwort ist falsch!');
        return res.redirect("/profile");
    }

    if (password1 !== password2) {
        await req.flash('error', 'Die Passwörter stimmen nicht überein!');
        return res.redirect("/profile");
    }

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password1, salt, async function(err, hash) {
            req.user.password = hash;
            req.user.salt = salt;
            await req.user.save();
            await req.flash('success', 'Passwort erfolgreich geändert!');
            return res.redirect("/");
        });
    });
};
