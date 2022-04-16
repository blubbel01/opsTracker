const db = require('../../models').sequelize;

exports.index = async (req, res) => {

    const roles = await db.models.OperationType.findAll();

    res.render("tracker/leader/operationType/index", {
        title: "Operationstypen",
        roles,
    });
};
exports.create = async (req, res) => {
    res.render("tracker/leader/operationType/create", {
        title: `Operationstyp erstellen`,
    });
}
exports.store = async (req, res) => {
    const {
        countType,
        value,
        name,
        needValidCheck,
        timeOnDashboard,
    } = req.body;
    if (isNaN(countType) || isNaN(value) || name == null || needValidCheck == null || name.length < 1) {
        return res.redirect("/leader/operationTypes/create");
    }

    const operationType = await db.models.OperationType.create({
        name,
        countType,
        value,
        needValidCheck,
        timeOnDashboard: timeOnDashboard || 0,
    });

    await req.flash('success', `Du hast erfolgreich den Operationstyp ${operationType.name} erstellt. (Punkte: ${operationType.points})`);
    return res.redirect("/leader/operationTypes");
}
exports.show = async (req, res) => {
    const {id} = req.params;

    const operationType = await db.models.OperationType.findByPk(id);
    if (!operationType) {
        await req.flash('error', 'Der angegebene Operationstyp existiert nicht!');
        return res.redirect("/leader/operationTypes");
    }

    res.render("tracker/leader/operationType/show", {
        title: `${operationType.name} bearbeiten`,
        thisOpType: operationType,
    });
};
exports.update = async (req, res) => {
    const {id} = req.params;
    const {
        countType,
        value,
        name
    } = req.body;
    const operationType = await db.models.OperationType.findByPk(id);

    if (operationType) {
        operationType.countType = countType;
        operationType.value = value;
        operationType.name = name;
        await operationType.save();
        await req.flash('success', `Du hast den Operationstyp ${operationType.name} erfolgreich bearbeitet!`);
    } else {
        await req.flash('error', 'Der angegebene Operationstyp existiert nicht!');
    }

    res.redirect("/leader/operationTypes");
};
exports.delete = async (req, res) => {
    const {id} = req.params;
    const operationType = await db.models.OperationType.findByPk(id);
    if (operationType) {
        await operationType.destroy();
        await req.flash('success', `Du hast den Operationstyp ${operationType.name} erfolgreich gelöscht!`);
    } else {
        await req.flash('error', 'Der angegebene Operationstyp existiert nicht!');
    }
    res.redirect("/leader/operationTypes");
};
