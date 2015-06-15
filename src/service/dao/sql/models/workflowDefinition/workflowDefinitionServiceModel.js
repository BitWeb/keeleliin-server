/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinitionServiceModel = sequelize.define("WorkflowDefinitionServiceModel", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflow_definition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow_definition',
                key: 'id'
            }
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
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionServiceModel.belongsTo(models.WorkflowDefinition);
                WorkflowDefinitionServiceModel.hasMany(models.WorkflowDefinitionServiceParamValue, { foreignKey: 'workflow_definition_service_id', as: 'param_values'});
            }
        }
    });

    return WorkflowDefinitionServiceModel;
};