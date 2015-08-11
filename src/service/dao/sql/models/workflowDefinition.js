/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinition = sequelize.define("WorkflowDefinition", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        dateCreated: {
            type: DataTypes.DATE,
            field: 'date_created'
        },
        dateUpdated: {
            type: DataTypes.DATE,
            field: 'date_updated'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_public'
        }
    }, {
        tableName: 'workflow_definition',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinition.hasMany(models.WorkflowDefinitionService, { as: 'workflowServices' , foreignKey: {name: 'workflow_definition_id', allowNull: true}});
                WorkflowDefinition.hasMany(models.Workflow, {as: 'workflows', foreignKey: 'workflowDefinitionId'});
                WorkflowDefinition.belongsToMany(models.Project, {
                    through: 'project_workflow_definition',
                    foreignKey: 'workflow_definition_id',
                    otherKey: 'project_id',
                    as: 'projects'
                });
                WorkflowDefinition.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
                WorkflowDefinition.belongsToMany(models.Resource, {
                        through: 'workflow_definition_has_input_resource',
                        foreignKey: 'workflowDefinitionId',
                        as: 'inputResources'
                    }
                );
                WorkflowDefinition.hasMany(models.WorkflowDefinitionUser, {
                    as: 'users', foreignKey: 'workflow_definition_id'
                });
            }
        },

        hooks: {
            beforeCreate: function(workflowDefinition, options, fn) {
                workflowDefinition.date_created = new Date();
                fn(null, workflowDefinition);
            },
            beforeUpdate: function(workflowDefinition, options, fn) {
                workflowDefinition.date_updated = new Date();
                fn(null, workflowDefinition);
            }
        }
    });

    return WorkflowDefinition;
};