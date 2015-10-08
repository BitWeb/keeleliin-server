/**
 * Created by taivo on 12.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var editStatuses = {
        EDIT: 'edit',
        LOCKED: 'locked'
    };

    var accessStatuses = {
        PRIVATE: 'private',
        PUBLIC: 'public',
        SHARED: 'shared'
    };

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
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        purpose: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        accessStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: accessStatuses.PRIVATE,
            field: 'access_status'
        },
        editStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false,
            field: 'edit_status',
            defaultValue: editStatuses.EDIT
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        tableName: 'workflow_definition',
        timestamps: true,
        paranoid: false,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinition.hasMany(models.WorkflowDefinitionService, {
                        as: 'definitionServices' ,
                        foreignKey: 'workflowDefinitionId'
                    }
                );
                WorkflowDefinition.hasMany(models.Workflow, {
                        as: 'workflows',
                        foreignKey: 'workflowDefinitionId'
                    }
                );

                WorkflowDefinition.belongsTo(models.User, {
                        as: 'user',
                        foreignKey: 'userId'
                    }
                );

                WorkflowDefinition.belongsTo(models.Project, {
                        as: 'project',
                        foreignKey: 'projectId'
                    }
                );

                WorkflowDefinition.belongsToMany(models.User, {
                        as: 'workflowDefinitionUsers',
                        through: {
                            model: models.WorkflowDefinitionUser,
                            foreignKey: 'workflowDefinitionId',
                            otherKey: 'userId',
                            unique: true
                        }
                    }
                );
                WorkflowDefinition.hasMany(models.WorkflowDefinitionUser, {
                        as: 'workflowDefinitionUserRelations',
                        foreignKey: 'workflowDefinitionId'
                    }
                );
            }
        }

    });

    WorkflowDefinition.editStatuses = editStatuses;
    WorkflowDefinition.accessStatuses = accessStatuses;

    return WorkflowDefinition;
};