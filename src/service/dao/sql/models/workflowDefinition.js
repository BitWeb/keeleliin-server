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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            unique: false
        },
        input_resource_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'resource',
                key: 'id'
            },
            unique: false
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
        date_created: {
            type: DataTypes.DATE
        },
        date_updated: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'workflow_definition',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinition.hasMany(models.WorkflowDefinitionService, { as: 'workflowServices' , foreignKey: {name: 'workflow_definition_id', allowNull: true}});
                WorkflowDefinition.hasMany(models.Workflow);
                WorkflowDefinition.belongsToMany(models.Project, {through: 'project_workflow_definition', foreignKey: 'workflow_definition_id', otherKey: 'project_id', as: 'projects'});
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