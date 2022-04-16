const db = require('../models').sequelize;
let tempMoney = 9999;
const moment = require('moment');
moment.locale('de');
const {Op} = require('sequelize');
const {Payment} = require("../helpers/payment");
const utilityHelper = require('../helpers/utility');

exports.index = async (req, res) => {

    const operations = (await db.models.Operation.findAll({
        include: [
            "OperationType",
            "Users",
        ],
        where: {
            valid: false,
        }
    })).filter(o => !o.valid);

    await Promise.all(operations.map(op => {
        op.isOwnMember = !!op.Users.find(u => u.id === req.user.id);
        op.time = new Date(op.timestamp).getTime();
        return op;
    }));


    res.render('tracker/operations/index', {
        title: 'Aktionen',
        operations
    });
};
exports.setMembership = async (req, res) => {
    if (!req.user.isGettingPayed) {
        await req.flash('error', 'Du bist dazu nicht befugt!');
        return res.redirect('/operations');
    }

    const {
        id
    } = req.body;
    const operation = await db.models.Operation.findByPk(id, {
        include: [
            "Users"
        ]
    });

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations');
    }

    if (!!operation.Users.find(u => u.id === req.user.id)) {
        await operation.removeUser(req.user);
        await req.flash('success', 'Du hast dich erfolgreich ausgetragen.');
    } else {
        await operation.addUser(req.user);
        await req.flash('success', 'Du hast dich erfolgreich eingetragen.');
    }

    res.redirect('/operations');
};

exports.setTempMoney = async (req, res) => {
    const {money} = req.body;
    tempMoney = money;
    await req.flash('success', 'Das Auszahlungsgehalt wurde angepasst. = ' + tempMoney);
    return res.redirect('/payment');
};
exports.payment = async (req, res) => {
    const users = await db.models.User.findAll({
        where: {
            isGettingPayed: true,
        },
        include: [
            db.models.Role,
            db.models.Faction,
        ],
    });

    await Promise.all(users.map(async (user) => {
        const payment = await Payment.getUserPayment(user.id, moment().startOf("week"), moment().endOf("week"));
        user.totalMoney = payment.totalMoney;
        user.operationMoney = payment.operationMoney;
        user.instructorMoney = payment.instructorMoney;
    }));

    res.render('tracker/operations/payment', {
        title: 'Auszahlung',
        users,
    });
};
exports.create = async (req, res) => {
    const operationTypes = await db.models.OperationType.findAll();
    res.render('tracker/operations/create', {
        title: 'Aktion eintragen',
        operationTypes
    });
};
exports.store = async (req, res) => {
    const {operation, date, time, location, proofs, tsValidate, value} = req.body;
    const timestamp = Date.parse(`${date}T${time}`);

    if (operation == "" || !operation || isNaN(operation)) {
        await req.flash('error', 'Die Aktion muss angegeben werden!');
        return res.redirect('/operations/create');
    }

    if (isNaN(timestamp)) {
        await req.flash('error', 'Die angegebene Zeit ist ungültig!');
        return res.redirect('/operations/create');
    }

    const tsValidateArray = tsValidate.split(' ');

    const syncedUsers = (await db.models.User.findAll({
        where: {
            isGettingPayed: true,
        }
    }))
        .filter(u => u.roleId)
        .filter(u => tsValidateArray.includes(u.name));

    const key = utilityHelper.generateRandomString(5).toUpperCase();

    const operationType = await db.models.OperationType.findByPk(operation);

    if (!operationType) {
        await req.flash('error', 'Der angegebene Aktionstyp ist ungültig!');
        return res.redirect('/operations/create');
    }

    const newOp = await db.models.Operation.create({
        value,
        location,
        key,
        type: operationType.id,
        valid: !operationType.needValidCheck,
        proof: proofs,
        timestamp: timestamp,
        creatorId: req.user.id,
    });

    syncedUsers.forEach(u => {
        newOp.addUser(u);
    });

    await req.flash('success', `Die Aktion wurde erfolgreich eingetragen. (Key: ${newOp.id}#${key}${utilityHelper.getCheckStringChar(`${newOp.id}${key}`)})`);
    return res.redirect('/operations');
};

exports.join = async (req, res) => {
    const {key: input} = req.body;

    const [id, fullKey] = input.split('#');
    const key = fullKey.substr(0, fullKey.length - 1);

    if (!utilityHelper.checkString(`${id}${fullKey}`)) {
        await req.flash('error', 'Der Schlüssel wurde falsch abgeschrieben. Bitte überprüfe, ob jedes Zeichen übereinstimmt!');
        return res.redirect('/operations');
    }

    const operation = await db.models.Operation.findByPk(id, {
        include: [
            "OperationType",
            "Users"
        ]
    });

    if (!operation) {
        await req.flash('error', `Aktion #${id} konnte nicht gefunden werden.`);
        return res.redirect('/operations');
    }

    if (operation.key != key) {
        await req.flash('error', 'Der angegebene Schlüssel ist falsch!');
        return res.redirect('/operations');
    }

    if (!operation.Users.find(u => u.id === req.user.id)) {
        await operation.addUser(req.user);
        await req.flash('success', `Du hast dich erfolgreich in die Aktion ${operation.OperationType.name}#${operation.id} eingetragen.`);
    }

    return res.redirect('/operations');
};
exports.leave = async (req, res) => {
    const {id} = req.body;

    const operation = await db.models.Operation.findByPk(id, {
        include: [
            "OperationType",
            "Users"
        ]
    });

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations');
    }
    await operation.removeUser(req.user);

    await req.flash('success', 'Du hast dich erfolgreich aus der Aktion ');
    res.redirect('/operations');
};

exports.managementIndex = async (req, res) => {
    const operations = (await db.models.Operation.findAll({
        include: [
            "OperationType",
            "Users",
        ]
    })).filter(o => !o.valid);

    await Promise.all(operations.map(op => {
        op.isOwnMember = !!op.Users.find(u => u.id === req.user.id);
        op.time = new Date(op.timestamp).getTime();
        return op;
    }));

    // return res.json(operations);

    res.render('tracker/operations/manage', {
        title: 'Aktionsverwaltung',
        operations,
    });
};
exports.managementValidate = async (req, res) => {
    const {id} = req.params;

    const operation = await db.models.Operation.findByPk(id);

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations/manage');
    }
    operation.valid = true;
    await operation.save();

    await req.flash('success', 'Die Aktion wurde erfolgreich bestätigt.');
    res.redirect('/operations/manage');
};
exports.managementDelete = async (req, res) => {
    const {id} = req.params;

    const operation = await db.models.Operation.findByPk(id);

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations/manage');
    }
    await operation.destroy();

    await req.flash('success', 'Die Aktion wurde erfolgreich gelöscht.');
    res.redirect('/operations/manage');
};
exports.managementAddUser = async (req, res) => {
    const {id} = req.params;

    const operation = await db.models.Operation.findByPk(id, {
        include: [
            "OperationType",
            "Users"
        ]
    });

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations/manage');
    }

    const {
        userName
    } = req.body;

    if (!userName) {
        return res.redirect('/operations/manage');
    }

    const user = await db.models.User.findOne({
        where: {
            name: userName
        }
    });

    if (!user) {
        await req.flash('error', 'Dieser Spieler existiert nicht!');
        return res.redirect('/operations/manage');
    }

    if (!operation.Users.find(u => u.id === user.id)) {
        await operation.addUser(user);
        await req.flash('success', `Spieler ${user.name}#${user.id} wurde erfolgreich zu ${operation.OperationType.name}#${operation.id} hinzugefügt.`);
    } else {
        await req.flash('info', `Spieler ${user.name}#${user.id} ist bereits in ${operation.OperationType.name}#${operation.id} eingetragen.`);
    }

    return res.redirect('/operations/manage');
};
exports.managementRemoveUser = async (req, res) => {
    const {id} = req.params;

    const operation = await db.models.Operation.findByPk(id, {
        include: [
            "OperationType",
            "Users"
        ]
    });

    if (!operation) {
        await req.flash('error', 'Die Aktion wurde nicht gefunden.');
        return res.redirect('/operations/manage');
    }

    const {
        userId
    } = req.body;

    const user = await db.models.User.findByPk(userId);
    if (!user) {
        await req.flash('error', 'Dieser Spieler existiert nicht!');
        return res.redirect('/operations/manage');
    }

    await operation.removeUser(user);

    await req.flash('success', `Spieler ${user.name}#${user.id} wurde erfolgreich aus ${operation.OperationType.name}#${operation.id} entfernt.`);
    return res.redirect('/operations/manage');
};

exports.statisticsIndex = async (req, res) => {
    let {start, stop} = req.query;
    if (start && stop) {
        start = new Date(start).getTime();
        stop = new Date(stop).getTime();
    } else {
        start = moment().startOf("week");
        stop = moment().endOf("week");
    }

    const users = await db.models.User.findAll({
        where: {
            isGettingPayed: true,
        },
        include: [
            db.models.Role,
            db.models.Faction,
        ],
    });

    await Promise.all(users.map(async (user) => {
        const payment = await Payment.getUserPayment(user.id, start, stop);
        user.totalMoney = payment.totalMoney;
        user.operationMoney = payment.operationMoney;
        user.instructorMoney = payment.instructorMoney;
    }));

    res.render('tracker/operations/overview', {
        title: 'Auszahlung - Statistik',
        users,
        start: moment.unix(new Date(start).getTime() / 1000).format('YYYY-MM-DD'),
        stop: moment.unix(new Date(stop).getTime() / 1000).format('YYYY-MM-DD'),
    });
};
