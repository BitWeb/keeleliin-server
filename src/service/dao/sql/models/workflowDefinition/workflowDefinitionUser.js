"use strict";

module.exports = function(sequelize, DataTypes) {

    var roles = {
        OWNER : 'owner',
        EDITOR : 'editor'
    };

    var WorkflowDefinitionUser = sequelize.define("WorkflowDefinitionUser", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id'
            },
            field: 'user_id'
        },
        workflowDefinitionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'WorkflowDefinition',
                key: 'id'
            },
            field: 'workflow_definition_id'
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: roles.OWNER
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
        tableName: 'workflow_definition_user',
        timestamps: false,
        paranoid: false,
        underscored: true,
        classMethods: {
            associate: function(models) {
                WorkflowDefinitionUser.belongsTo(models.WorkflowDefinition, {
                    as: 'workflowDefinition',
                    foreignKey: 'workflowDefinitionId'
                });

                WorkflowDefinitionUser.belongsTo(models.User, {
                    as: 'user',
                    foreignKey: 'userId'
                });
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

    WorkflowDefinitionUser.roles = roles;

    return WorkflowDefinitionUser;
};