"use strict";
const {
    Model, Sequelize
} = require("sequelize");
module.exports = (sequelize) => {
    class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
        static associate(models) {
            // define association here
        }
    }
    users.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        role: Sequelize.STRING,
        password: Sequelize.STRING
    }, {
        sequelize,
        modelName: "user",
        timestamps: false
    });
    return users;
};
