/**
 * Created by priit on 9.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var Project = sequelize.define("Project", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        //created_at
        //updated_at

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        }
    }, {
        tableName: 'project',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Project.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
                Project.belongsToMany(models.Resource, {through: 'project_has_resource', foreignKey: 'project_id', otherKey: 'resource_id'});
                Project.belongsToMany(models.WorkflowDefinition, {through: 'project_workflow_definition', foreignKey: 'project_id', otherKey: 'workflow_definition_id'});
            }
        }
    });

    return Project;
};