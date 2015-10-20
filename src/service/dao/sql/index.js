/**
 * Created by priit on 4.06.15.
 */
"use strict";

var Sequelize = require("sequelize");
var config    = require(__base + 'config');

var sequelize = new Sequelize(config.sql.database, config.sql.username, config.sql.password, {
    dialect: config.sql.dialect,
    host: config.sql.host,
    port: config.sql.port,
    omitNull: true
});

var db = {};

db['Notification'] = sequelize.import('./models/notification');
db['NotificationType'] = sequelize.import('./models/notification/notificationType');
db['Project'] = sequelize.import('./models/project');
db['ProjectUser'] = sequelize.import('./models/project/projectUser');
db['Resource'] = sequelize.import('./models/resource');
db['ResourceType'] = sequelize.import('./models/resource/resourceType');
db['ResourceAssociation'] = sequelize.import('./models/resource/resourceAssociation');
db['Service'] = sequelize.import('./models/service');
db['ServiceParam'] = sequelize.import('./models/service/serviceParam');
db['ParamOption'] = sequelize.import('./models/service/param/paramOption');
db['ServiceInputType'] = sequelize.import('./models/service/serviceInputType');
db['ServiceOutputType'] = sequelize.import('./models/service/serviceOutputType');
db['User'] = sequelize.import('./models/user');
db['WorkflowDefinition'] = sequelize.import('./models/workflowDefinition');
db['WorkflowDefinitionService'] = sequelize.import('./models/workflowDefinition/workflowDefinitionService');
db['WorkflowDefinitionUser'] = sequelize.import('./models/workflowDefinition/workflowDefinitionUser');
db['Workflow'] = sequelize.import('./models/workflow');
db['WorkflowService'] = sequelize.import('./models/workflow/workflowService');
db['WorkflowServiceSubstep'] = sequelize.import('./models/workflow/workflowServiceSubstep');


Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
module.exports = db;