"use strict";

module.exports = function(sequelize, DataTypes) {

    var roles = {
        OWNER : 'owner',
        EDITOR : 'editor'
    };

    var WorkflowDefinitionUser = sequelize.define("WorkflowDefinitionUser", {
        userId: {
            type: DataTypes.INTEGER,
            field: 'user_id'
        },
        workflowDefinitionId: {
            type: DataTypes.INTEGER,
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
        paranoid: true,
        underscored: true,
        classMethods: {
            associate: function(models) {
                WorkflowDefinitionUser.belongsTo(models.WorkflowDefinition, {
                    as: 'workflowDefinition',
                    foreignKey: 'workflow_definition_id'
                });
                WorkflowDefinitionUser.belongsTo(models.User, {
                    as: 'user',
                    foreignKey: 'user_id'
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