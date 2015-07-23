/**
 * Created by taivo on 26.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var sizeUnits = {
        PIECE: 'piece',
        BYTE: 'byte'
    };

    var ServiceInputType = sequelize.define("ServiceInputType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false
        },
        do_parallel: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        size_limit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        size_unit: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: sizeUnits.BYTE
        }
    }, {
        tableName: 'service_input_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceInputType.belongsTo(models.Service, {as: 'service'});
                ServiceInputType.belongsTo(models.ResourceType, {as: 'resourceType'});
            }
        }
    });

    ServiceInputType.sizeUnits = sizeUnits;

    return ServiceInputType;
};