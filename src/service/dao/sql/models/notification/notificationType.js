"use strict";

module.exports = function(sequelize, DataTypes) {

    var codes = {
        WORKFLOW_FINISHED : 'workflow-finished',
        WORKFLOW_STILL_RUNNING : 'workflow-still-running',
        WORKFLOW_ERROR : 'workflow-error',

        PROJECT_USER_ADDED : 'project-user-added'
    };

    var NotificationType = sequelize.define("NotificationType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        urlTemplate: {
            type: DataTypes.TEXT,
            field: 'url_template',
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            field: 'message',
            allowNull: false
        },
        applicationContext: {
            type: DataTypes.STRING,
            field: 'application_context',
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            field: 'code',
            allowNull: false
        },
        isSendEmail: {
            type: DataTypes.BOOLEAN,
            field: 'is_send_email',
            allowNull: false,
            defaultValue: true
        },
        notifyPeriodDays: {
            type: DataTypes.INTEGER,
            field: 'notify_period_days',
            allowNull: false,
            defaultValue: 0
        },
        mailSubject: {
            type: DataTypes.STRING,
            field: 'mail_subject',
            allowNull: true
        },
        mailTemplate: {
            type: DataTypes.STRING,
            field: 'mail_template',
            allowNull: true
        }
    }, {
        tableName: 'notification_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
            }
        }
    });

    NotificationType.codes = codes;

    return NotificationType;
};