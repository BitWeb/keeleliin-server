/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ParamOption = sequelize.define("ParamOption", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceParamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service_param',
                key: 'id'
            },
            field: 'service_param_id'
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true
        },
        label: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'param_option',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ParamOption.belongsTo(models.ServiceParam, {foreignKey: 'serviceParamId', as: 'serviceParam'});

            }
        }
    });

    return ParamOption;
};