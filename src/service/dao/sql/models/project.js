/**
 * Created by priit on 9.06.15.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {

    var Project = sequelize.define("Project", {
        //id
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            primaryKey: false
        },
        //created_at
        //updated_at

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
        }
    }, {
        tableName: 'project',
        timestamps: true,
        paranoid: true,
        underscored: true,

        classMethods: {
            associate: function(models) {
                Project.belongsTo(models.User, {as: 'user'});
            }
        }
    });

    return Project;
};