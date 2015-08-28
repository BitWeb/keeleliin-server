/**
 * Created by priit on 9.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var roles = {
        ROLE_REGULAR    : 'regular',
        ROLE_ADMIN      : 'admin'
    };

    var User = sequelize.define("User", {
        entuId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: false,
            field: 'entu_id'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        displaypicture: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        dateApiAccessed: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'date_api_accessed'
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'role',
            defaultValue: roles.ROLE_REGULAR
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            field: 'is_active',
            defaultValue: true
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
        tableName: 'user',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                User.belongsToMany(models.Project, {as: 'userProjects', through: models.ProjectUser, foreignKey: 'user_id'});
                User.hasMany(models.Project,{as: 'projects', foreignKey: 'userId'});
                User.hasMany(models.ProjectUser,{as: 'userProjectRelations', foreignKey: 'user_id'});
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

    User.roles = roles;

    return User;
};