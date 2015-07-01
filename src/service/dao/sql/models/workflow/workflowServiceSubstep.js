"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowServiceSubstep = sequelize.define("WorkflowServiceSubstep", {
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
        prev_substep_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workflow_service_substep',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'INIT'
        },
        index: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        datetime_start: {
            type: DataTypes.DATE,
            allowNull: true
        },
        datetime_end: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'workflow_service_substep',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowServiceSubstep.belongsTo(models.WorkflowService, {as: 'workflowService'});
                WorkflowServiceSubstep.belongsTo(models.WorkflowServiceSubstep);
                WorkflowServiceSubstep.belongsToMany(models.Resource, {
                        through: 'workflow_service_substep_has_input_resource',
                        foreignKey: 'workflow_service_substep_id',
                        as: 'inputResources'}
                );
                WorkflowServiceSubstep.belongsToMany(models.Resource, {
                        through: 'workflow_service_substep_has_output_resource',
                        foreignKey: 'workflow_service_substep_id',
                        as: 'outputResources'}
                );
            }
        }
    });

    return WorkflowServiceSubstep;
};