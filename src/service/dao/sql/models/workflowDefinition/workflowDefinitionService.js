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
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service',
                key: 'id'
            }
        },
        order_num: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'workflow_definition_service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionService.belongsTo(models.WorkflowDefinition);
                WorkflowDefinitionService.hasMany(models.WorkflowDefinitionServiceParamValue, { foreignKey: 'workflow_definition_service_id', as: 'paramValues', onDelete: 'cascade'});
            }
        }
    });

    return WorkflowDefinitionService;
};