"use strict";

module.exports = function(sequelize, DataTypes) {

    var splitTypes = {
        NONE        : "NONE",
        LINE    : "LINE"
    };

    var ResourceType = sequelize.define("ResourceType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        splitType: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'split_type'
        }
    }, {
        tableName: 'resource_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                //ServiceInputType.belongsTo(models.Service);
            }
        }
    });

    ResourceType.splitTypes = splitTypes;

    return ResourceType;
};