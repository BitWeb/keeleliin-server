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

db['User'] = sequelize.import('./models/user');
db['Project'] = sequelize.import('./models/project');
db['Resource'] = sequelize.import('./models/resource');
db['ResourceType'] = sequelize.import('./models/resource/resourceType');

db['WorkflowDefinition'] = sequelize.import('./models/workflowDefinition');
db['WorkflowDefinitionService'] = sequelize.import('./models/workflowDefinition/workflowDefinitionService');
db['Workflow'] = sequelize.import('./models/workflow');
db['WorkflowService'] = sequelize.import('./models/workflow/workflowService');
db['WorkflowServiceSubstep'] = sequelize.import('./models/workflow/workflowServiceSubstep');
db['WorkflowDefinitionServiceParamValue'] = sequelize.import('./models/workflowDefinition/workflowDefinitionServiceParamValue');
db['WorkflowServiceParamValue'] = sequelize.import('./models/workflow/workflowServiceParamValue');
db['Service'] = sequelize.import('./models/service');
db['ServiceParam'] = sequelize.import('./models/service/serviceParam');
db['ServiceInputType'] = sequelize.import('./models/service/serviceInputType');
db['ServiceOutputType'] = sequelize.import('./models/service/serviceOutputType');

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
module.exports = db;