/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var statusCodes = {
        INIT: 'INIT',
        RUNNING: 'RUNNING',
        FINISHED: 'FINISHED',
        ERROR: 'ERROR'
    };

    var Workflow = sequelize.define("Workflow", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project',
                key: 'id'
            },
            field: 'project_id'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: statusCodes.INIT
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
        datetimeCreated: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_created'
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
        tableName: 'workflow',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Workflow.belongsTo(models.WorkflowDefinition, {
                        foreignKey:'workflowDefinitionId',
                        as: 'workflowDefinition'
                    }
                );
                Workflow.belongsTo(models.Project, {
                        foreignKey:'projectId',
                        as: 'project'
                    }
                );

                Workflow.hasMany(models.WorkflowService, {
                    foreignKey:'workflowId',
                    as: 'workflowServices'
                });
                Workflow.belongsToMany(models.Resource, {
                        through: 'workflow_has_input_resource',
                        foreignKey: 'workflow_id',
                        as: 'inputResources'
                    }
                );
            }
        },
        hooks: {
            beforeCreate: function(resource, options, fn) {
                resource.datetimeCreated = new Date();
                fn(null, resource);
            }
        }
    });

    Workflow.statusCodes = statusCodes;

    return Workflow;
};