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
        resourceTypeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'resource_type',
                key: 'id'
            },
            field: 'resource_type_id'
        },
        doParallel: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field:'do_parallel'
        },
        sizeLimit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field:'size_limit'
        },
        sizeUnit: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: sizeUnits.BYTE,
            field: 'size_unit'
        },
        isList: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field:'is_list'
        }
    }, {
        tableName: 'service_input_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceInputType.belongsTo(models.Service, {as: 'service'});
                ServiceInputType.belongsTo(models.ResourceType, {
                    foreignKey: 'resourceTypeId',
                    as: 'resourceType'
                });
            }
        }
    });

    ServiceInputType.sizeUnits = sizeUnits;

    return ServiceInputType;
};