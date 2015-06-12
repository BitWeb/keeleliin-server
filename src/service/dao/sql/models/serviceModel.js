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
        }
    }, {
        tableName: 'service',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceModel.hasMany(models.ServiceModelParam);
                ServiceModel.belongsToMany(ServiceModel, {through: 'service_has_parent_service', as: 'ChildServiceModels', foreignKey: 'service_parent_id'});
                ServiceModel.belongsToMany(ServiceModel, {through: 'service_has_parent_service', as: 'ParentServiceModels', foreignKey: 'service_sibling_id'});
            }
        }
    });

    return ServiceModel;
};