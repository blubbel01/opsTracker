'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OperationUserTotalOffset extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.User, {foreignKey: 'user'});
            this.hasOne(models.OperationType, {foreignKey: 'type'});
        }
    };
    OperationUserTotalOffset.init({
        type: DataTypes.INTEGER,
        user: DataTypes.INTEGER,
        timestamp: DataTypes.DATE,
    }, {
        sequelize,
        modelName: 'OperationUserTotalOffset',
    });
    return OperationUserTotalOffset;
};
