/**
 * Created by taivo on 26.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var ServiceOutputType = sequelize.define("ServiceOutputType", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'service_output_type',
        timestamps: false,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                ServiceOutputType.belongsTo(models.Service);
                ServiceOutputType.belongsTo(models.ResourceType);
            }
        }
    });

    return ServiceOutputType;
};