/**
 * Created by taivo on 12.06.15.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinitionServiceParamValue = sequelize.define("WorkflowDefinitionServiceParamValue", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        //workflow_definition_service_id: {
        //    type: DataTypes.INTEGER,
        //    allowNull: false,
        //    references: {
        //        model: 'workflow_definition_service',
        //        key: 'id'
        //    }
        //},
        service_param_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'service_param',
                key: 'id'
            }
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'workflow_definition_service_param_value',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionServiceParamValue.belongsTo(models.WorkflowDefinitionServiceModel);
                WorkflowDefinitionServiceParamValue.belongsTo(models.ServiceModelParam, {foreignKey: 'service_param_id', as: 'service_param'});
            }
        }
    });

    return WorkflowDefinitionServiceParamValue;
};