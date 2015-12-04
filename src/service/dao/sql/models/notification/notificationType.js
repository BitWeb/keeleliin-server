"use strict";

module.exports = function(sequelize, DataTypes) {

    var applicationContexts = {
        PROJECT: 'project',
        USER: 'user',
        WORKFLOW: 'workflow',
        WORKFLOW_DEFINITION: 'workflow-definition'
    };

    var codes = {
        WORKFLOW_FINISHED : 'workflow-finished',
        WORKFLOW_STILL_RUNNING : 'workflow-still-running',
        WORKFLOW_ERROR : 'workflow-error',
        PROJECT_USER_ADDED : 'project-user-added',
        WORKFLOW_DEFINITION_UNPUBLISHED : 'workflow-definition-unpublished'
    };

    var NotificationType = sequelize.define("NotificationType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        applicationContext: { //workflow, project, user
            type: DataTypes.STRING,
            field: 'application_context',
            allowNull: false
        },
        code: { //workflow-still-running, workflow-finished, workflow-error, project-user-added
            type: DataTypes.STRING,
            field: 'code',
            allowNull: false
        },
        urlTemplate: {
            type: DataTypes.TEXT,
            field: 'url_template',
            allowNull: false
        },
        messageTemplate: {
            type: DataTypes.TEXT,
            field: 'message_template',
            allowNull: false
        },

        isSendEmail: {
            type: DataTypes.BOOLEAN,
            field: 'is_send_email',
            allowNull: false,
            defaultValue: true
        },
        mailSubjectTemplate: {
            type: DataTypes.STRING,
            field: 'mail_subject_template',
            allowNull: true
        },
        notifyPeriodDays: {
            type: DataTypes.INTEGER,
            field: 'notify_period_days',
            allowNull: false,
            defaultValue: 0
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
    NotificationType.applicationContexts = applicationContexts;

    return NotificationType;
};