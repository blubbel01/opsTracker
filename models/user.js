'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsToMany(models.Operation, {through: "user_operation"});
            this.belongsTo(models.Role, {foreignKey: "roleId"});
        }
    };
    User.init({
        name: DataTypes.STRING,
        forumId: DataTypes.INTEGER,
        roleId: DataTypes.INTEGER,
        password: DataTypes.STRING,
        salt: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'User',
    });
    return User;
};
