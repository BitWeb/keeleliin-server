/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceParam = sequelize.define("ServiceParam", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service',
                key: 'id'
            },
            field: 'service_id'
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'text'
        },
        key: {
            type: DataTypes.STRING,
            allowNull: true
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true
        },
        orderNum: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'order_num'
        },
        isEditable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_editable'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'service_param',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceParam.belongsTo(models.Service, {foreignKey: 'serviceId', as: 'service'});
                ServiceParam.hasMany(models.WorkflowDefinitionServiceParamValue, { foreignKey: 'service_param_id' });
            }
        }
    });

    return ServiceParam;
};