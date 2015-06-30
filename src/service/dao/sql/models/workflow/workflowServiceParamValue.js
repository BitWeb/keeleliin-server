/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowServiceParamValue = sequelize.define("WorkflowServiceParamValue", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflow_service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow_service',
                key: 'id'
            }
        },
        service_param_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service_param',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'workflow_service_param_value',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowServiceParamValue.belongsTo(models.ServiceParam, {foreignKey: 'service_param_id', as: 'service_param'});
            }
        }
    });

    return WorkflowServiceParamValue;
};