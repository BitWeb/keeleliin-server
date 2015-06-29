/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceModel = sequelize.define("ServiceModel", {
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
                ServiceModel.hasMany(models.ServiceModelParam, { foreignKey: 'service_id', as: 'serviceParams' });
                ServiceModel.hasMany(models.ServiceInputType, { foreignKey: 'service_id', as: 'serviceInputTypes' });
                ServiceModel.hasMany(models.ServiceOutputType, { foreignKey: 'service_id', as: 'serviceOutputTypes' });
                ServiceModel.belongsToMany(ServiceModel, {through: 'service_has_parent_service', as: 'ChildServiceModels', foreignKey: 'service_parent_id'});
                ServiceModel.belongsToMany(ServiceModel, {through: 'service_has_parent_service', as: 'ParentServiceModels', foreignKey: 'service_sibling_id'});
            }
        }
    });

    return ServiceModel;
};