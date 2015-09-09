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
        }
    }, {
        tableName: 'workflow_definition_service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionService.belongsTo(models.Service, { foreignKey: 'serviceId', as: 'service' });
                WorkflowDefinitionService.belongsTo(models.WorkflowDefinition, { foreignKey: 'workflowDefinitionId', as: 'workflowDefinition' });
                WorkflowDefinitionService.hasMany(models.WorkflowDefinitionServiceParamValue, { foreignKey: 'definitionServiceId', as: 'paramValues', onDelete: 'cascade'});
            }
        }
    });

    return WorkflowDefinitionService;
};