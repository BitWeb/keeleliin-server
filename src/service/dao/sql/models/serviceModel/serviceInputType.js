/**
 * Created by taivo on 26.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceInputType = sequelize.define("ServiceInputType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'service_input_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceInputType.belongsTo(models.ServiceModel);
            }
        }
    });

    return ServiceInputType;
};