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
db['Project'] = sequelize.import(__base + 'src/service/dao/sql/models/project');
db['Resource'] = sequelize.import(__base + 'src/service/dao/sql/models/resource');
db['WorkflowDefinition'] = sequelize.import(__base + 'src/service/dao/sql/models/workflowDefinition');
db['WorkflowDefinitionServiceModel'] = sequelize.import(__base + 'src/service/dao/sql/models/workflowDefinition/workflowDefinitionServiceModel');
db['Workflow'] = sequelize.import(__base + 'src/service/dao/sql/models/workflow');
db['WorkflowServiceModel'] = sequelize.import(__base + 'src/service/dao/sql/models/workflow/workflowServiceModel');
db['WorkflowDefinitionServiceParamValue'] = sequelize.import(__base + 'src/service/dao/sql/models/workflowDefinition/workflowDefinitionServiceParamValue');
db['WorkflowServiceParamValue'] = sequelize.import(__base + 'src/service/dao/sql/models/workflow/workflowServiceParamValue');
db['ServiceModel'] = sequelize.import(__base + 'src/service/dao/sql/models/serviceModel');
db['ServiceModelParam'] = sequelize.import(__base + 'src/service/dao/sql/models/serviceModel/serviceModelParam');

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
module.exports = db;