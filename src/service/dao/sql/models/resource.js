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
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: true
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
                Resource.hasMany(models.ResourceAssociation, {
                        foreignKey: 'resourceId',
                        as: 'associations'
                    }
                );
            }
        }
    });

    return Resource;
};