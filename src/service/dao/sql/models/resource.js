/**
 * Created by taivo on 11.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var fileTypes = {
        FOLDER  : 'FOLDER',
        FILE    : 'FILE'
    };

    var Resource = sequelize.define("Resource", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        parentFolderId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'resource',
                key: 'id'
            },
            field: 'parent_folder_id'
        },
        fileType: {
            type: DataTypes.STRING,
            defaultValue: fileTypes.FILE,
            allowNull: false,
            field: 'file_type'
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
        filename: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false,
            field: 'original_name'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        dateCreated: {
            type: DataTypes.DATE,
            field: 'date_created'
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
        author: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
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
        dateUpdated: {
            type: DataTypes.DATE,
            field: 'date_updated'
        }
    }, {
        tableName: 'resource',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Resource.belongsTo(models.ResourceType, {
                    foreignKey: 'resourceTypeId',
                    as: 'resourceType'
                });
                Resource.belongsToMany(models.Project, {
                    through: 'project_has_resource',
                    foreignKey: 'resource_id',
                    otherKey: 'project_id',
                    as: 'projects'
                });
                Resource.hasMany(models.Resource, {
                    foreignKey: 'parentFolderId',
                    as: 'resourceFiles'
                });
                Resource.belongsTo(models.Resource, {
                    foreignKey: 'parentFolderId',
                    as: 'parentFolder' });
                Resource.belongsToMany(models.WorkflowDefinition, {
                    through: 'workflow_definition_has_input_resource',
                    foreignKey: 'resource_id',
                    otherKey: 'workflow_definition_id',
                    as: 'workflowDefinitions'}
                );
                Resource.belongsToMany(models.Workflow, {
                    through: 'workflow_has_input_resource',
                    foreignKey: 'resource_id',
                    otherKey: 'workflow_id',
                    as: 'workflows'}
                );
                Resource.belongsToMany(models.WorkflowServiceSubstep, {
                        through: 'workflow_service_substep_has_input_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'workflow_service_substep_id'}
                );
                Resource.belongsToMany(models.WorkflowServiceSubstep, {
                        through: 'workflow_service_substep_has_output_resource',
                        foreignKey: 'resource_id',
                        otherKey: 'workflow_service_substep_id'
                    }
                );
            }
        },

        hooks: {
            beforeCreate: function(resource, options, fn) {
                resource.date_created = new Date();
                fn(null, resource);
            },
            beforeUpdate: function(resource, options, fn) {
                resource.date_updated = new Date();
                fn(null, resource);
            }
        }
    });

    Resource.fileTypes = fileTypes;

    return Resource;
};