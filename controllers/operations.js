const db = require('../models').sequelize;
let tempMoney = 9999;
const moment = require('moment');
moment.locale('de');
const {Op} = require('sequelize');

exports.setTempMoney = async (req, res) => {
    const {money} = req.body;
    tempMoney = money;
    await req.flash('success', 'Das Auszahlungsgehalt wurde angepasst. = ' + tempMoney);
    return res.redirect('/payment');
};
exports.payment = async (req, res) => {
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
                        [Op.gte]: moment().startOf("week")
                    },
                    {
                        [Op.lte]: moment().endOf("week")
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
                        proportion: 0,
                        money: 0,
                    };
                }
            });
        }
    });

    Object.keys(members).forEach(name => {
        members[name].money = totalPoints > 0 ? (members[name].points / totalPoints) * tempMoney : (Object.keys(members).length / tempMoney) * tempMoney;
    });

    let membersArray = [];

    const users = await db.models.User.findAll({
        include: "Role"
    });

    users.forEach(user => {
        if (!!user.Role) {
            membersArray.push({
                name: user.name,
                roleName: user.Role.name,
                sortId: user.Role.permissionLevel,
                points: !!members[user.id] ? members[user.id].points : 0,
                money: !!members[user.id] ? members[user.id].money : 0,
            });
        }
    });

    membersArray = membersArray
        .sort((a, b) => {
            return b.money - a.money;
        })
        .sort((a, b) => {
            return b.sortId - a.sortId;
        });

    res.render('tracker/operations/payment', {
        title: 'Auszahlung',
        members: membersArray,
        paymentMoneyTotal: tempMoney,
        totalPoints,
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
    res.redirect('/payment');
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
exports.statisticsIndex = async (req, res) => {
    let {start, stop} = req.query;
    if (start && stop) {
        start = new Date(start).getTime();
        stop = new Date(stop).getTime();
    } else {
        start = moment().startOf("week");
        stop = moment().endOf("week");
    }


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
            membersArray.push({
                name: user.name,
                roleName: user.Role.name,
                sortId: user.Role.permissionLevel,
                points: !!members[user.id] ? members[user.id].points : 0,
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
    });
};
