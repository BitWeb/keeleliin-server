/**
 * Created by priit on 9.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var accessStatuses = {
        PRIVATE: 'private',
        SHARED: 'shared'
    };

    var Project = sequelize.define("Project", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        },
        accessStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: accessStatuses.PRIVATE,
            field: 'access_status'
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
        tableName: 'project',
        timestamps: true,
        paranoid: false,
        underscored: true,

        classMethods: {
            associate: function(models) {

                Project.belongsTo(models.User, {
                        as: 'user',
                        foreignKey: 'userId'
                    }
                );
                Project.belongsToMany(models.User, {
                        as: 'projectUsers',
                        through: models.ProjectUser,
                        foreignKey: 'projectId'
                    }
                );
                Project.hasMany(models.ProjectUser, {
                        as: 'projectUserRelations',
                        foreignKey: 'projectId'
                    }
                );
                Project.hasMany(models.WorkflowDefinition, {
                        as: 'workflowDefinitions',
                        foreignKey: 'projectId'
                    }
                );
                Project.hasMany(models.Workflow, {
                        as: 'workflows',
                        foreignKey: 'projectId'
                    }
                );
                Project.belongsToMany(models.Resource, {
                        as: 'resources',
                        through: {
                            model: models.ResourceAssociation,
                            foreignKey: 'projectId',
                            unique: false
                        }
                    }
                );
                Project.hasMany(models.ResourceAssociation, {
                        as: 'resourceAssociations',
                        foreignKey: 'projectId',
                        unique: false
                    }
                );
            }
        }
    });

    Project.accessStatuses = accessStatuses;

    return Project;
};