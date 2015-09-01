/**
 * Created by taivo on 12.06.15.
 */
"use strict";

var logger = require('log4js').getLogger('workflow');

var statusCodes = {
    INIT: 'INIT',
    RUNNING: 'RUNNING',
    FINISHED: 'FINISHED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED'
};

module.exports = function(sequelize, DataTypes) {



    var Workflow = sequelize.define("Workflow", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            primaryKey: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        purpose: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project',
                key: 'id'
            },
            field: 'project_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            },
            field: 'user_id'
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: statusCodes.INIT
        },
        log: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        workflowDefinitionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workflow_definition',
                key: 'id'
            },
            field: 'workflow_definition_id'
        },
        datetimeCreated: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_created'
        },
        datetimeUpdated: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'datetime_updated'
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
        tableName: 'workflow',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {

                Workflow.belongsTo(models.User, {as: 'user', foreignKey: 'userId'});

                Workflow.belongsTo(models.WorkflowDefinition, {
                        foreignKey:'workflowDefinitionId',
                        as: 'workflowDefinition'
                    }
                );
                Workflow.belongsTo(models.Project, {
                        foreignKey:'projectId',
                        as: 'project'
                    }
                );

                Workflow.hasMany(models.WorkflowService, {
                    foreignKey:'workflowId',
                    as: 'workflowServices'
                });
                Workflow.belongsToMany(models.Resource, {
                        through: 'workflow_has_input_resource',
                        foreignKey: 'workflow_id',
                        as: 'inputResources'
                    }
                );
            }
        },
        hooks: {
            beforeCreate: function(item, options, fn) {
                item.datetimeCreated = new Date();
                fn(null, item);
            },
            beforeUpdate: function(item, options, fn) {
                item.datetimeUpdated = new Date();
                fn(null, item);
            }
        },
        instanceMethods: {
            getFirstWorkflowService: function (cb) {
                this.getWorkflowServices({
                    order: [['order_num', 'ASC']],
                    limit: 1
                }).then(function (items) {
                    if (items.length > 0) {
                        return cb(null, items[0]);
                    }
                    return cb();
                }).catch(function (err) {
                    return cb(err);
                });
            },
            start: function (cb) {

                if (this.status != statusCodes.INIT) {
                    return cb('Antud töövoog on juba varem käivitatud');
                }

                this.status = Workflow.statusCodes.RUNNING;
                this.datetimeStart = new Date();
                this.save().then(function () {
                    cb();
                }).catch(function (err) {
                    cb(err.message);
                });
            },
            finish: function(status, cb){
                logger.debug('Set workflow status: ' + status);
                this.status = status;
                this.datetimeEnd = new Date();
                this.save().then(function () {
                    cb();
                }).catch(function (err) {
                    cb(err);
                });
            }
        }
    });

    Workflow.statusCodes = statusCodes;

    return Workflow;
};

module.exports.statusCodes = statusCodes;