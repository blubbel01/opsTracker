'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Operation extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.OperationType, {foreignKey: "type"});
            this.belongsTo(models.User, {foreignKey: "creatorId", as: 'creator'});
            this.belongsToMany(models.User,{through: "user_operation"});
        }
    };
    Operation.init({
        type: DataTypes.INTEGER,
        location: DataTypes.STRING,
        proof: DataTypes.TEXT,
        valid: DataTypes.BOOLEAN,
        value: DataTypes.INTEGER,
        timestamp: DataTypes.DATE,
        creatorId: DataTypes.INTEGER,
        key: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Operation',
    });
    return Operation;
};
