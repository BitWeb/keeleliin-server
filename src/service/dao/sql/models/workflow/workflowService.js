/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var statusCodes = {
        INIT: 'INIT',
        RUNNING: 'RUNNING',
        ERROR: 'ERROR',
        FINISHED: 'FINISHED'
    };

    var WorkflowService = sequelize.define("WorkflowService", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service',
                key: 'id'
            }
        },
        workflow_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: statusCodes.INIT
        },
        order_num: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        log: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
        },
        datetime_start: {
            type: DataTypes.DATE,
            allowNull: true
        },
        datetime_end: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'workflow_service',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowService.belongsTo(models.Service, {as: 'service'});
                WorkflowService.belongsTo(models.Workflow);
                WorkflowService.hasMany(models.WorkflowServiceSubstep, {foreignKey: 'workflow_service_id', as: 'subSteps'});
                WorkflowService.hasMany(models.WorkflowServiceParamValue, {foreignKey: 'workflow_service_id', as: 'paramValues'});
            }
        }
    });

    WorkflowService.statusCodes = statusCodes;


    return WorkflowService;
};