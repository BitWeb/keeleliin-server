/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

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
            defaultValue: 'INIT'
        },
        order_num: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
                WorkflowService.belongsTo(models.Workflow);
                WorkflowService.hasMany(models.WorkflowServiceParamValue, {foreignKey: 'workflow_service_id', as: 'param_values'});
            }
        }
    });

    return WorkflowService;
};