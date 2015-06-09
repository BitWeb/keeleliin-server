/**
 * Created by priit on 4.06.15.
 */
"use strict";

var Sequelize = require("sequelize");
var config    = require(__base + 'config');

var sequelize = new Sequelize(config.sql.database, config.sql.username, config.sql.password, {
    dialect: config.sql.dialect,
    port: config.sql.port,
    omitNull: true
});

var db = {};

db['User'] = sequelize.import(__base + 'src/service/dao/sql/models/user');

db['Service'] = sequelize.import(__base + 'src/service/dao/sql/models/service');
db['ServiceParam'] = sequelize.import(__base + 'src/service/dao/sql/models/serviceParam');

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;