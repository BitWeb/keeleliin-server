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
        discMax: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'disc_max',
            defaultValue: 1073741824
        },
        discCurrent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'disc_current',
            defaultValue: 0
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
        tableName: 'user',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                User.belongsToMany(models.Project, {
                        as: 'userProjects',
                        through: models.ProjectUser,
                        foreignKey: 'userId'
                    }
                );
                User.hasMany(models.Project,{
                        as: 'createdProjects',
                        foreignKey: 'userId'
                    }
                );
                User.hasMany(models.ProjectUser,{
                        as: 'userProjectRelations',
                        foreignKey: 'userId'
                    }
                );

                User.belongsToMany(models.WorkflowDefinition, {
                        as: 'userWorkflowDefinition',
                        through: {
                            model: models.WorkflowDefinitionUser,
                            foreignKey: 'userId',
                            unique: true
                        }
                    }
                );

            }
        }
    });

    User.roles = roles;

    return User;
};