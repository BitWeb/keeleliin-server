"use strict";

module.exports = function(sequelize, DataTypes) {

    var WorkflowDefinitionUser = sequelize.define("WorkflowDefinitionUser", {
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
        tableName: 'workflow_definition_user',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                WorkflowDefinitionUser.belongsTo(models.WorkflowDefinition);
            }
        }
    });

    return WorkflowDefinitionUser;
};