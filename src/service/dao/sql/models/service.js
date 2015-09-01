/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var Service = sequelize.define("Service", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sid: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        url: {
            type: DataTypes.TEXT
        },
        isSynchronous: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field:'is_synchronous'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field:'is_active'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        tableName: 'service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Service.hasMany(models.ServiceParam, { foreignKey: 'service_id', as: 'serviceParams', onDelete: 'cascade'});
                Service.hasMany(models.ServiceInputType, { foreignKey: 'service_id', as: 'serviceInputTypes',  onDelete: 'cascade'});
                Service.hasMany(models.ServiceOutputType, { foreignKey: 'service_id', as: 'serviceOutputTypes',  onDelete: 'cascade'});
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'childServices', foreignKey: 'service_parent_id'});
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'parentServices', foreignKey: 'service_sibling_id'});
            }
        }
    });

    return Service;
};