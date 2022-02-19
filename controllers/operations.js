const db = require('../models').sequelize;
let tempMoney = 9999;
const moment = require('moment');
moment.locale('de');
const {Op} = require('sequelize');
const {Payment} = require("../helpers/payment");

exports.index = async (req, res) => {

    const startDate = moment(Date.now() - (30 * 60 * 1000));

    const operations = (await db.models.Operation.findAll({
        include: [
            "OperationType",
            "Users",
        ],
        where: {
            timestamp: {
                [Op.gte]: startDate
            }
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
    const {operation, date, time, location, proofs, tsValidate} = req.body;
    const timestamp = Date.parse(`${date}T${time}`);

    if (operation == "" || !operation || isNaN(operation)) {
        await req.flash('error', 'Die Aktion muss angegeben werden!');
        return res.redirect('/operations/create');
    }

    if (isNaN(timestamp)) {
        await req.flash('error', 'Die angegebene Zeit ist ungültig!');
        return res.redirect('/operations/create');
    }

    const syncedUsers = (await db.models.User.findAll())
        .filter(u => u.roleId)
        .filter(u => tsValidate.includes(u.name));


    const newOp = await db.models.Operation.create({
        type: Number(operation),
        location: location,
        proof: proofs,
        valid: false,
        timestamp: timestamp,
    });

    syncedUsers.forEach(u => {
        newOp.addUser(u);
    });

    await req.flash('success', 'Die Aktion wurde erfolgreich eingetragen.');
    return res.redirect('/operations');
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

    res.render('tracker/operations/admin', {
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
    let {start, stop, money} = req.query;
    if (start && stop) {
        start = new Date(start).getTime();
        stop = new Date(stop).getTime();
    } else {
        start = moment().startOf("week");
        stop = moment().endOf("week");
    }

    money = Number(money) || 0;


    const operations = await db.models.Operation.findAll({
        include: [
            "OperationType",
            {
                association: "Users"
            }
        ],
        where: {
            timestamp: {
                [Op.and]: [
                    {
                        [Op.gte]: start
                    },
                    {
                        [Op.lte]: stop
                    }
                ]
            }
        }
    });

    const members = {};
    let totalPoints = 0;
    operations.forEach(op => {
        if (op.valid) {
            const points = op.OperationType.points;
            op.Users.forEach(u => {
                totalPoints += points;
                if (members[u.id]) {
                    members[u.id].points += points;
                } else {
                    members[u.id] = {
                        name: u.name,
                        points,
                    };
                }
            });
        }
    });

    let membersArray = [];

    const users = await db.models.User.findAll({
        include: "Role"
    });

    users.forEach(user => {
        if (!!user.Role) {
            const points = !!members[user.id] ? members[user.id].points : 0;
            membersArray.push({
                name: user.name,
                roleName: user.Role.name,
                sortId: user.Role.permissionLevel,
                points,
                money: Math.floor((money / (totalPoints === 0 ? 1 : totalPoints)) * points),
            });
        }
    });

    membersArray = membersArray
        .sort((a, b) => {
            return b.points - a.points;
        })
        .sort((a, b) => {
            return b.sortId - a.sortId;
        });

    res.render('tracker/operations/overview', {
        title: 'Auszahlung - Statistik',
        members: membersArray,
        totalPoints,
        start: moment.unix(new Date(start).getTime() / 1000).format('YYYY-MM-DD'),
        stop: moment.unix(new Date(stop).getTime() / 1000).format('YYYY-MM-DD'),
        money,
    });
};
