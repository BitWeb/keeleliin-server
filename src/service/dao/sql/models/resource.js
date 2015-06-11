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
        source_file_location: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        name: {
            type: DataTypes.STRING
        },
        date_created: {
            type: DataTypes.DATE
        },
        file_location: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
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
        }
    }, {
        tableName: 'resource',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Resource.belongsToMany(models.Project, {through: 'project_has_resource', foreignKey: 'resource_id', otherKey: 'project_id'});
            }
        }
    });

    return Resource;
};