const db = require('../models').sequelize;
const Utility = require('../helpers/utility');
const bcrypt = require('bcrypt');
const auth = require('../helpers/auth');
const saltRounds = 10;
const cheerio = require('cheerio');

exports.login = (req, res) => {
    res.render('tracker/login', {title: 'Anmelden'});
};
exports.loginSubmit = async (req, res) => {
    const {username: name, password} = req.body;

    const loginUser = await db.models.User.findOne({
        where: {
            name: name
        }
    });

    if (!loginUser) {
        await req.flash('error', 'Es gibt keinen Benutzer mit diesem Namen!');
        return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, loginUser.password);

    if (!match) {
        await req.flash('error', 'Das Passwort stimmt nicht überein!');
        return res.redirect('/login');
    }


    (async () => {
        try {
            const body = await Utility.asyncFetch(`https://forum.vio-v.com/index.php?user/${loginUser.forumId}`);
            const $ = cheerio.load(body);
            const changeUsername = $('meta[property="profile:username"]').attr('content');

            if (changeUsername != loginUser.name) {
                loginUser.name = changeUsername;
                loginUser.save();
            }
        } catch (_) {}
    })();

    auth.setUser(req.session.id, loginUser.id);
    res.redirect("/");
};

exports.register = (req, res) => {
    res.render('tracker/register', {title: 'Registrieren'});
}
exports.submitRegister = async (req, res) => {
    const {name, password, password2} = req.body;

    const forumId = Number((await Utility.asyncFetch(`https://forum.vio-v.com/userProfile.php?user=${name}`)).substring(39));

    if (forumId === 0 || isNaN(forumId)) {
        await req.flash('error', 'Der Spielername ist auf VioV nicht bekannt!');
        return res.redirect('/register');
    }

    if(password !== password2) {
        await req.flash('error', 'Das Passwort stimmt nicht überein!');
        return res.redirect('/register');
    }

    const testUser = await db.models.User.findOne({
        where: {
            forumId: forumId
        }
    });

    if (testUser) {
        await req.flash('error', 'Der Spieler ist bereits registriert!');
        return res.redirect('/register');
    }

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            db.models.User.create({
                name: name,
                forumId: forumId,
                password: hash,
                salt: salt,
            });
            return res.redirect("/");
        });
    });
}

exports.logout = (req, res) => {
    auth.removeUser(req.session.id);
    res.redirect('/login');
}
