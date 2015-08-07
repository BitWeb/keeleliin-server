"use strict";

module.exports = function(sequelize, DataTypes) {

    var ResourceUser = sequelize.define("ResourceUser", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        }
    }, {
        tableName: 'resource_user',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ResourceUser.belongsTo(models.Resource);
            }
        }
    });

    return ResourceUser;
};