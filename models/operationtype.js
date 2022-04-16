'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OperationType extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.hasMany(models.Operation, {foreignKey: "type"});
        }
    };
    OperationType.init({
        name: DataTypes.STRING,
        value: DataTypes.INTEGER,
        countType: DataTypes.INTEGER,
        needValidCheck: DataTypes.BOOLEAN,
        timeOnDashboard: DataTypes.DOUBLE,
    }, {
        sequelize,
        modelName: 'OperationType',
    });
    return OperationType;
};
