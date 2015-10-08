"use strict";

module.exports = function(sequelize, DataTypes) {

    var roles = {
        ROLE_OWNER : 'owner',
        ROLE_EDITOR : 'editor',
        ROLE_VIEWER : 'viewer'
    };

    var ProjectUser = sequelize.define("projectUser", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project',
                key: 'id'
            },
            field: 'project_id'
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: roles.ROLE_EDITOR
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
        tableName: 'project_user',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ProjectUser.belongsTo(models.Project, {
                        as: 'project',
                        foreignKey:'projectId'
                    }
                );
                ProjectUser.belongsTo(models.User, {
                        as: 'user',
                        foreignKey:'userId'
                    }
                );
            }
        },

        hooks: {
            beforeCreate: function(resource, options, fn) {
                resource.createdAt = new Date();
                fn(null, resource);
            },
            beforeUpdate: function(resource, options, fn) {
                resource.updatedAt = new Date();
                fn(null, resource);
            }
        }
    });

    ProjectUser.roles = roles;

    return ProjectUser;
};