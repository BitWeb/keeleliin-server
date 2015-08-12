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
        }
    }, {
        tableName: 'service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Service.hasMany(models.ServiceParam, { foreignKey: 'service_id', as: 'serviceParams' });
                Service.hasMany(models.ServiceInputType, { foreignKey: 'service_id', as: 'serviceInputTypes' });
                Service.hasMany(models.ServiceOutputType, { foreignKey: 'service_id', as: 'serviceOutputTypes' });
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'childServices', foreignKey: 'service_parent_id'});
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'parentServices', foreignKey: 'service_sibling_id'});
            }
        }
    });

    return Service;
};