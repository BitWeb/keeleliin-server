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
            allowNull: false,
            primaryKey: false
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
        tableName: 'user',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                User.hasMany(models.Project,{as: 'projects', foreignKey: 'userId'});
            }
        }
    });

    return User;
};