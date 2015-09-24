/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinitionService = sequelize.define("WorkflowDefinitionService", {
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
        workflowDefinitionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow_definition',
                key: 'id'
            },
            field: 'workflow_definition_id'
        },
        orderNum: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'order_num'
        },
        serviceParamsValues: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            field: 'service_params_values'
        }
    }, {
        tableName: 'workflow_definition_service',
        timestamps: false,
        paranoid: false,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionService.belongsTo(models.Service, { foreignKey: 'serviceId', as: 'service' });
                WorkflowDefinitionService.belongsTo(models.WorkflowDefinition, { foreignKey: 'workflowDefinitionId', as: 'workflowDefinition' });
            }
        }
    });

    return WorkflowDefinitionService;
};