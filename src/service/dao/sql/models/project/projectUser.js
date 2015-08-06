"use strict";

module.exports = function(sequelize, DataTypes) {

    var roles = {
        ROLE_OWNER : 'owner',
        ROLE_EDITOR : 'editor',
        ROLE_VIEWER : 'viewer'
    };

    var ProjectUser = sequelize.define("projectUser", {
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
            field: 'updatedAt'
        }
    }, {
        tableName: 'project_user',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
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