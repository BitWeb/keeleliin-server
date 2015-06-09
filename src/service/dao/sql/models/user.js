/**
 * Created by priit on 9.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var User = sequelize.define("User", {
        entu_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        }
    }, {
        tableName: 'user',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                /*Service.hasMany(models.ServiceParam);
                Service.belongsToMany(models.Service, {as: 'Parents', through: 'parent_services'});*/
            }
        }
    });

    return User;
};