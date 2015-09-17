"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowServiceSubstep = sequelize.define("WorkflowServiceSubstep", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflowServiceId: {
            type: DataTypes.INTEGER,
            foreignKey: true,
            allowNull: false,
            references: {
                model: 'workflow_service',
                key: 'id'
            },
            field: 'workflow_service_id'
        },
        prevSubstepId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workflow_service_substep',
                key: 'id'
            },
            field: 'prev_substep_id'
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
        serviceSession: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
            field: 'service_session'
        },
        log: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: ''
        },
        datetimeStart: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_start'
        },
        datetimeEnd: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_end'
        }
    }, {
        tableName: 'workflow_service_substep',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowServiceSubstep.belongsTo(models.WorkflowService, {
                        as: 'workflowService',
                        foreignKey: 'workflowServiceId'
                    }
                );
                WorkflowServiceSubstep.hasMany(models.Resource, {
                        as: 'outputResources',
                        foreignKey: 'workflowServiceSubstepId'
                    }
                );
                WorkflowServiceSubstep.belongsTo(models.WorkflowServiceSubstep, {
                        foreignKey: 'prevSubstepId',
                        as: 'prevSubstep'
                    }
                );
                WorkflowServiceSubstep.belongsToMany(models.Resource, {
                        through: 'workflow_service_substep_has_input_resource',
                        foreignKey: 'workflow_service_substep_id',
                        as: 'inputResources'}
                );
            }
        }
    });

    return WorkflowServiceSubstep;
};