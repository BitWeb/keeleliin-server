"use strict";

module.exports = function(sequelize, DataTypes) {

    var Notification = sequelize.define("Notification", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        notificationTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'notification_type',
                key: 'id'
            },
            field: 'notification_type_id'
        },
        toUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'to_user_id'
        },
        modelId: {
            type: DataTypes.INTEGER,
            field: 'model_id',
            allowNull: true
        },

        url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        mailSubject: {
            type: DataTypes.TEXT,
            field: 'mail_subject',
            allowNull: true
        },
        mailBody: {
            type: DataTypes.TEXT,
            field: 'mail_body',
            allowNull: true
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            field: 'is_read',
            allowNull: false,
            defaultValue: false
        },
        isEmailSent: {
            type: DataTypes.BOOLEAN,
            field: 'is_email_sent',
            allowNull: false,
            defaultValue: false
        },
        dateRead: {
            type: DataTypes.DATE,
            field: 'date_read',
            allowNull: true
        },
        dateEmailSent: {
            type: DataTypes.DATE,
            field: 'date_email_sent',
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        tableName: 'notification',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Notification.belongsTo(models.User, {as: 'toUser', foreignKey: 'toUserId'});
                Notification.belongsTo(models.NotificationType, {as: 'notificationType', foreignKey: 'notificationTypeId'});
            }
        },
        hooks: {
            beforeCreate: function(resource, options, fn) {
                resource.createdAt = new Date();
                fn(null, resource);
            },
            beforeUpdate: function(resource, options, fn) {
                resource.updatedAt = new Date();
                fn(null, resource);
            }
        }
    });

    return Notification;
};