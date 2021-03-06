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
        parentVersionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'service',
                key: 'id'
            },
            allowNull: true,
            defaultValue: null,
            omitNull: false,
            field: 'parent_version_id'
        },
        sid: {
            type: DataTypes.STRING,
            allowNull: false,
            omitNull: false
        },
        name: {
            type: DataTypes.STRING,
            omitNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            omitNull: false
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: true
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
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        tableName: 'service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {

                Service.hasOne(Service, {as: 'parentVersion', foreignKey: 'parentVersionId'});
                Service.hasMany(Service, { foreignKey: 'parentVersionId', as: 'childVersions'});

                Service.hasMany(models.ServiceParam, { foreignKey: 'serviceId', as: 'serviceParams', onDelete: 'cascade'});
                Service.hasMany(models.ServiceInputType, { foreignKey: 'serviceId', as: 'serviceInputTypes',  onDelete: 'cascade'});
                Service.hasMany(models.ServiceOutputType, { foreignKey: 'serviceId', as: 'serviceOutputTypes',  onDelete: 'cascade'});

                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'childServices', foreignKey: 'service_parent_id'});
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'parentServices', foreignKey: 'service_sibling_id'});
            }
        },
        hooks: {
            beforeCreate: function(item, options, fn) {
                item.createdAt = new Date();
                fn(null, item);
            },
            updatedAt: function(item, options, fn) {
                item.updatedAt = new Date();
                fn(null, item);
            }
        }
        });

    return Service;
};