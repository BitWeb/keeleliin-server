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
        }
    }, {
        tableName: 'service',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Service.hasMany(models.ServiceParam, { foreignKey: 'service_id', as: 'serviceParams' });
                Service.hasMany(models.ServiceInputType, { foreignKey: 'service_id', as: 'serviceInputTypes' });
                Service.hasMany(models.ServiceOutputType, { foreignKey: 'service_id', as: 'serviceOutputTypes' });
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'ChildServices', foreignKey: 'service_parent_id'});
                Service.belongsToMany(Service, {through: 'service_has_parent_service', as: 'ParentServices', foreignKey: 'service_sibling_id'});
            }
        }
    });

    return Service;
};