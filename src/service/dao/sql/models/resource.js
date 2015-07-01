/**
 * Created by taivo on 11.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var Resource = sequelize.define("Resource", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        parent_folder_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'resource',
                key: 'id'
            }
        },
        file_type: {
            type: DataTypes.STRING,
            defaultValue: 'FILE',
            allowNull: false
        },
        resource_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'resource_type',
                key: 'id'
            }
        },
        source_original_name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        source_filename: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        date_created: {
            type: DataTypes.DATE
        },
        corpora_name: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
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
        content_type: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
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
        date_updated: {
            type: DataTypes.DATE
        },
        hash: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'resource',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Resource.belongsToMany(models.Project, {through: 'project_has_resource', foreignKey: 'resource_id', otherKey: 'project_id'});
                Resource.hasMany(models.Resource, { foreignKey: 'parent_folder_id', as: 'resourceFiles' });
                Resource.belongsTo(models.Resource, { foreignKey: 'parent_folder_id', as: 'parent_folder' });

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
                        otherKey: 'workflow_service_substep_id'}
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

    return Resource;
};