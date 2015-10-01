"use strict";

module.exports = function(sequelize, DataTypes) {

    var ResourceUser = sequelize.define("ResourceUser", {

        userId: {
            type: DataTypes.INTEGER,
            field: 'user_id'
        },
        resourceId: {
            type: DataTypes.INTEGER,
            field: 'resource_id'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        }
    }, {
        tableName: 'resource_user',
        timestamps: false,
        paranoid: false,
        underscored: true,
        hooks: {
            beforeCreate: function(resource, options, fn) {
                resource.createdAt = new Date();
                fn(null, resource);
            }
        },
        classMethods: {
            associate: function(models) {
                ResourceUser.belongsTo(models.Resource, {as: 'resource', foreignKey: 'resourceId'});
                ResourceUser.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});
            }
        }
    });

    return ResourceUser;
};