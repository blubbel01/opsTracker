const bcrypt = require('bcrypt');
const {sequelize: db} = require("../models");
const saltRounds = 10;

exports.index = async (req, res) => {
    res.render("tracker/index", {
        title: "Dashboard",
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
