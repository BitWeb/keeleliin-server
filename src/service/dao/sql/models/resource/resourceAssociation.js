/**
 * Created by taivo on 11.06.15.
 */

"use strict";
var logger = require('log4js').getLogger('resource_association');
var config = require(__base + 'config');
var fs = require('fs');

module.exports = function(sequelize, DataTypes) {

    var contexts = {
        PROJECT_UPLOAD  : 'project_upload',
        WORKFLOW_INPUT  : 'workflow_input',
        WORKFLOW_OUTPUT  : 'workflow_output',

        SUBSTEP_INPUT   : 'substep_input',
        SUBSTEP_OUTPUT  : 'substep_output',

        SHARED  : 'shared',
        PUBLIC  : 'public'
    };

    var ResourceAssociation = sequelize.define("resourceAssociation", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        context: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        resourceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'resource',
                key: 'id'
            },
            field: 'resource_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'project',
                key: 'id'
            },
            field: 'project_id'
        },
        workflowId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workflow',
                key: 'id'
            },
            field: 'workflow_id'
        },
        workflowServiceSubstepId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workflow_service_substep',
                key: 'id'
            },
            field: 'workflow_service_substep_id'
        }
    }, {
        tableName: 'resource_association',
        timestamps: true,
        paranoid: false,
        underscored: true,

        hooks: {
            beforeCreate: function(resource, options) {
                //maybe some duplicate validation
            }
        },

        classMethods: {
            associate: function(models) {
                ResourceAssociation.belongsTo(models.Resource, {
                        foreignKey: 'resourceId',
                        as: 'resource'
                    }
                );
                ResourceAssociation.belongsTo(models.User, {
                        foreignKey: 'userId',
                        as: 'user'
                    }
                );
                ResourceAssociation.belongsTo(models.Project, {
                        foreignKey: 'projectId',
                        as: 'project'
                    }
                );
                ResourceAssociation.belongsTo(models.Workflow, {
                        foreignKey: 'workflowId',
                        as: 'workflow'
                    }
                );
                ResourceAssociation.belongsTo(models.WorkflowServiceSubstep, {
                        foreignKey: 'workflowServiceSubstepId',
                        as: 'workflowServiceSubstep'
                    }
                );
            }
        }
    });

    ResourceAssociation.contexts = contexts;

    return ResourceAssociation;
};