const {Op} = require("sequelize");
const moment = require("moment");
const db = require('../models').sequelize;

const PARAMETERS = {
    operationMultiplier: 0.95,
    instructionMultiplier: 0.1,
};

class Payment {

    /**
     * @param startDate
     * @param endDate
     * @return {Promise<{userCount: number, totalMoney: number, instructorCount: number}>}
     */
    static async getPaymentData(startDate, endDate) {
        let instructorCount = await db.models.User.count({
            where: {
                isGettingPayed: true,
                isInstructor: true,
            }
        });
        let userCount = await db.models.User.count({
            where: {
                isGettingPayed: true,
            }
        });
        let totalMoney = 0;

        const operations = await db.models.Operation.findAll({
            where: {
                timestamp: {
                    [Op.and]: [
                        {
                            [Op.gte]: startDate
                        },
                        {
                            [Op.lte]: endDate
                        }
                    ]
                }
            },
            include: [
                {
                    model: db.models.OperationType,
                }
            ],
        });

        operations.forEach(({amount, OperationType}) => {
            const {value, countType} = OperationType;

            switch (countType) {
                case 0: // operation.amount = money
                    totalMoney += amount;
                    break;
                case 1: // OperationType.value = money
                    totalMoney += value;
                    break;
                case 2: // OperationType.value * operation.amount = money
                    totalMoney += amount * value;
                    break;
            }
        });

        return {
            totalMoney,
            instructorCount,
            userCount,
        }
    }

    /**
     * @param userId
     * @param startDate
     * @param endDate
     * @return {Promise<{totalMoney: number, instructorMoney: number, operationMoney: number}>}
     */
    static async getUserPayment(userId, startDate, endDate) {
        const user = await db.models.User.findByPk(userId);
        const operations = await db.models.Operation.findAll({
            where: {
                timestamp: {
                    [Op.and]: [
                        {
                            [Op.gte]: startDate
                        },
                        {
                            [Op.lte]: endDate
                        }
                    ]
                }
            },
            include: [
                {
                    model: db.models.OperationType,
                },
                {
                    model: db.models.User,
                    where: {
                        id: user.id,
                    },
                    attributes: [],
                }
            ],
        });
        const data = await Payment.getPaymentData();

        if (!user) {
            console.error(`USER NOF FOUND! ID = ${userId}`);
            return {
                instructorMoney: 0,
                operationMoney: 0,
                totalMoney: 0,
            }
        }

        let instructorMoney = 0;
        if (user.isInstructor) {
            instructorMoney += (data.totalMoney * PARAMETERS.instructionMultiplier) / data.instructorCount;
        }

        let operationMoney = 0;
        operations.forEach(({amount, OperationType}) => {
            const {value, countType} = OperationType;

            switch (countType) {
                case 0: // operation.amount = money
                    operationMoney += amount;
                    break;
                case 1: // OperationType.value = money
                    operationMoney += value;
                    break;
                case 2: // OperationType.value * operation.amount = money
                    operationMoney += amount * value;
                    break;
            }
        });

        return {
            instructorMoney,
            operationMoney: operationMoney * PARAMETERS.operationMultiplier,
            totalMoney: instructorMoney + (operationMoney * PARAMETERS.operationMultiplier),
        }
    }
}

module.exports = {
    Payment,
};
