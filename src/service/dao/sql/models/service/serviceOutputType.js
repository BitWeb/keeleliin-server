/**
 * Created by taivo on 26.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceOutputType = sequelize.define("ServiceOutputType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service',
                key: 'id'
            },
            field: 'service_id'
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
        key: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'service_output_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceOutputType.belongsTo(models.Service, {as: 'service', foreignKey: 'serviceId'});
                ServiceOutputType.belongsTo(models.ResourceType, {
                    foreignKey: 'resourceTypeId',
                    as: 'resourceType'
                });
            }
        }
    });

    return ServiceOutputType;
};