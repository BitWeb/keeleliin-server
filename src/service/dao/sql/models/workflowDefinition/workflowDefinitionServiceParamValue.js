/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinitionServiceParamValue = sequelize.define("WorkflowDefinitionServiceParamValue", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        definitionServiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow_definition_service',
                key: 'id'
            },
            field: 'workflow_definition_service_id'
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
        }
    }, {
        tableName: 'workflow_definition_service_param_value',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionServiceParamValue.belongsTo(models.WorkflowDefinitionService, {
                    foreignKey: 'definitionServiceId',
                    as: 'definitionService'}
                );
                WorkflowDefinitionServiceParamValue.belongsTo(models.ServiceParam, {
                    foreignKey: 'serviceParamId',
                    as: 'serviceParam'})
                ;
            }
        }
    });

    return WorkflowDefinitionServiceParamValue;
};