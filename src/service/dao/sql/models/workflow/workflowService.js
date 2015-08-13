/**
 * Created by taivo on 12.06.15.
 */

"use strict";

var logger = require('log4js').getLogger('workflow_service');
var WorkflowModel = require('../workflow');

module.exports = function (sequelize, DataTypes) {

    var WorkflowService = sequelize.define("WorkflowService", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service',
                key: 'id'
            },
            field: 'service_id'
        },
        workflowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow',
                key: 'id'
            },
            field: 'workflow_id'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: WorkflowModel.statusCodes.INIT
        },
        orderNum: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'order_num'
        },
        log: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: ''
        },
        datetimeStart: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_start'
        },
        datetimeEnd: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_end'
        }
    }, {
        tableName: 'workflow_service',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function (models) {
                WorkflowService.belongsTo(models.Service, {as: 'service', foreignKey: 'serviceId'});
                WorkflowService.belongsTo(models.Workflow, {as: 'workflow', foreignKey: 'workflowId'});
                WorkflowService.hasMany(models.WorkflowServiceSubstep, {
                    foreignKey: 'workflowServiceId',
                    as: 'subSteps'
                });
                WorkflowService.hasMany(models.WorkflowServiceParamValue, {
                    foreignKey: 'workflow_service_id',
                    as: 'paramValues'
                });
            }
        },
        instanceMethods: {
            getNextWorkflowService: function (cb) {
                var self = this;
                this.getWorkflow().then(function (workflow) {
                    workflow.getWorkflowServices({
                        where: {
                            workflowId: self.workflowId,
                            orderNum: {
                                gt: self.orderNum
                            }
                        },
                        order: [['order_num', 'ASC']]
                    }).then(function (items) {
                        if (items.length > 0) {
                            return cb(null, items[0]);
                        }
                        return cb();
                    }).catch(function (err) {
                        cb(err);
                    });
                }).catch(function (err) {
                    cb(err);
                });
            },
            start: function (cb) {

                if (this.status == WorkflowModel.statusCodes.INIT) {
                    this.status = WorkflowModel.statusCodes.RUNNING;
                    this.datetimeStart = new Date();

                    return this.save().then(function () {
                        cb(null);
                    }).catch(cb);

                } else if (this.status == WorkflowModel.statusCodes.ERROR) {
                    return cb('Töövoos on tekkinud viga');
                }

                cb(null);
            },
            finish: function (status, cb) {
                if (this.status != WorkflowModel.statusCodes.ERROR) {
                    this.status = status;
                    this.datetimeEnd = new Date();
                }
                this.save().then(function () {
                    cb();
                }).catch(function (err) {
                    cb(err.message);
                });
            }
        }
    });

    return WorkflowService;
};