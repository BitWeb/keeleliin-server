/**
 * Created by priit on 4.06.15.
 */
/**
 * Created by priit on 4.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceParam = sequelize.define("ServiceParam", {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true

        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false

        }
    }, {
        tableName: 'service_param',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            /*associate: function(models) {
             User.hasMany(models.Task)
             }*/
        }
    });

    return ServiceParam;
};