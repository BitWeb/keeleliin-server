/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var Workflow = sequelize.define("Workflow", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'INIT'
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
        tableName: 'workflow',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Workflow.hasMany(models.WorkflowService, {as: 'workflowServices'});
                Workflow.belongsTo(models.WorkflowDefinition);
                Workflow.belongsTo(models.Project, { as: 'project' });
                Workflow.belongsToMany(models.Resource, {
                        through: 'workflow_has_input_resource',
                        foreignKey: 'workflow_id',
                        as: 'inputResources'
                    }
                );
            }
        }
    });

    Workflow.statusCodes = {
        INIT: 'INIT',
        RUNNING: 'RUNNING',
        FINISHED: 'FINISHED',
        ERROR: 'ERROR'
    };

    return Workflow;
};