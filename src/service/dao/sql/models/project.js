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
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        tableName: 'project',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {

                Project.belongsToMany(models.WorkflowDefinition, {
                    through: 'project_workflow_definition',
                    foreignKey: 'project_id',
                    otherKey: 'workflow_definition_id'
                });
                Project.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
                Project.belongsToMany(models.User, {as: 'projectUsers', through: models.ProjectUser, foreignKey: 'project_id'});
                Project.hasMany(models.ProjectUser, {as: 'projectUserRelations', foreignKey: 'project_id'});
            }
        }
    });

    Project.accessStatuses = accessStatuses;

    return Project;
};