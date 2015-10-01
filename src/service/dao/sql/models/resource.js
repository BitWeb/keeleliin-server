/**
 * Created by taivo on 11.06.15.
 */

"use strict";
var logger = require('log4js').getLogger('resource_model');
var config = require(__base + 'config');
var fs = require('fs');

module.exports = function(sequelize, DataTypes) {

    var Resource = sequelize.define("Resource", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        resourceTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'resource_type',
                key: 'id'
            },
            field: 'resource_type_id'
        },
        workflowServiceSubstepId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workflow_service_substep',
                key: 'id'
            },
            field: 'workflow_service_substep_id'
        },
        workflowOutputId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            references: {
                model: 'workflow',
                key: 'id'
            },
            field: 'workflow_output_id'
        },
        filename: { //asukoht failisysteemis
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        originalName: { //faili nimikasutaja arvutis
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false,
            field: 'original_name'
        },
        name: { //kasutaja antud uus nimi või faili nimi arvutis
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        pid: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        fileSize: {
            type: DataTypes.INTEGER,
            primaryKey: false,
            allowNull: true,
            field: 'file_size'
        },
        corporaName: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false,
            field: 'corpora_name'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
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
        contentType: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false,
            field: 'content_type'
        },
        encoding: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        language: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_public'
        }
    }, {
        tableName: 'resource',
        timestamps: false,
        paranoid: false,
        underscored: true,

        hooks: {
            beforeCreate: function(resource, options) {
                resource.createdAt = new Date();
                var stats = fs.statSync(config.resources.location + resource.filename);
                resource.fileSize = stats["size"];
            }
        },

        classMethods: {
            associate: function(models) {
                Resource.belongsTo(models.ResourceType, {
                        foreignKey: 'resourceTypeId',
                        as: 'resourceType'
                    }
                );
                Resource.belongsToMany(models.Project, {
                        through: 'project_has_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'project_id',
                        as: 'projects'
                    }
                );
                Resource.belongsToMany(models.WorkflowDefinition, {
                        through: 'workflow_definition_has_input_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'workflow_definition_id',
                        as: 'workflowDefinitions'
                    }
                );
                Resource.belongsToMany(models.Workflow, {
                        through: 'workflow_has_input_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'workflow_id',
                        timestamps: false,
                        as: 'workflows'
                    }
                );
                Resource.belongsToMany(models.WorkflowServiceSubstep, {
                        through: 'workflow_service_substep_has_input_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'workflow_service_substep_id',
                        timestamps: false,
                        as: 'inputSubsteps'
                    }
                );
                Resource.belongsTo(models.WorkflowServiceSubstep, {
                        foreignKey: 'workflowServiceSubstepId',
                        as: 'outputSubsteps'
                    }
                );
                Resource.belongsTo(models.User, {
                        as: 'user',
                        foreignKey: 'userId'
                    }
                );
                Resource.hasMany(models.ResourceUser, {
                        as: 'users',
                        foreignKey: 'resourceId'
                    }
                );
                Resource.belongsToMany(models.User, {
                        as: 'resourceUsers',
                        through: models.ResourceUser,
                        foreignKey: 'resource_id'
                    }
                );
                Resource.belongsTo(models.Workflow, {
                        foreignKey: 'workflowOutputId',
                        as: 'workflowOutput'
                    }
                );
            }
        }
    });

    return Resource;
};