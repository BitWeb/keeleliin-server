/**
 * Created by priit on 4.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var Service = sequelize.define("Service", {

        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false

        }
    }, {
        tableName: 'service',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Service.hasMany(models.ServiceParam);
                Service.belongsToMany(models.Service, {as: 'Parents', through: 'parent_services'});
            }
        }
    });

    return Service;
};