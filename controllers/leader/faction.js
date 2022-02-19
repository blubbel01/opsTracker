const db = require('../../models').sequelize;

exports.index = async (req, res) => {

    const factions = await db.models.Faction.findAll();

    res.render("tracker/leader/faction/index", {
        title: "Fraktionsverwaltung",
        factions,
    });
};
exports.create = async (req, res) => {
    res.render("tracker/leader/faction/create", {
        title: `Fraktion erstellen`,
    });
}
exports.store = async (req, res) => {
    const {name} = req.body;
    if (!name || name.length < 1) {
        return res.redirect("/leader/faction/create");
    }

    const faction = await db.models.Faction.create({
        name,
    });

    await req.flash('success', `Du hast erfolgreich die Fraktion ${faction.name} erstellt.`);
    return res.redirect("/leader/faction");
}
exports.show = async (req, res) => {
    const {id} = req.params;

    const faction = await db.models.Faction.findByPk(id);
    if (!faction) {
        await req.flash('error', 'Die angegebene Fraktion existiert nicht!');
        return res.redirect("/leader/faction");
    }

    res.render("tracker/leader/faction/show", {
        title: `${faction.name} bearbeiten`,
        thisFaction: faction,
    });
};
exports.update = async (req, res) => {
    const {id} = req.params;
    const {name} = req.body;
    const faction = await db.models.Faction.findByPk(id);

    if (faction) {
        faction.name = name;
        await faction.save();
        await req.flash('success', `Du hast die Fraktion ${faction.name} erfolgreich bearbeitet!`);
    } else {
        await req.flash('error', 'Die angegebene Fraktion existiert nicht!');
    }

    res.redirect("/leader/faction");
};
exports.delete = async (req, res) => {
    const {id} = req.params;
    const faction = await db.models.Faction.findByPk(id);
    if (faction) {
        await faction.destroy();
        await req.flash('success', `Du hast die Fraktion ${faction.name} erfolgreich gelöscht!`);
    } else {
        await req.flash('error', 'Die angegebene Fraktion existiert nicht!');
    }
    res.redirect("/leader/faction");
};
