INSERT INTO resource_type(id, value, name, split_type) VALUES (1, 'TEXT', 'Tekst', 'NONE');
INSERT INTO resource_type(id, value, name, split_type) VALUES (2, 'WORD', 'Sõnad', 'NONE');

INSERT INTO resource(
            id, file_type, resource_type_id, source_original_name,
            source_filename, filename, name)
    VALUES (1, 'FILE', 1, 'name',
    'name', 'name', 'name');
INSERT INTO resource(
            id, file_type, resource_type_id, source_original_name,
            source_filename, filename, name)
    VALUES (2, 'FILE', 1, 'name2',
    'name2', 'name2', 'name2');

INSERT INTO "user" (id, entu_id, email, name) SELECT 1, 1, 'taivo@bitweb.ee', 'taivo' WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".id = 1);
INSERT INTO project (id, name, description, user_id) SELECT 1, 'test project', 'test project', 1 WHERE NOT EXISTS (SELECT 1 FROM project WHERE project.id = 1);
INSERT INTO workflow_definition (id, project_id, user_id, name, description) SELECT 1, 1, 1, 'Test workflow', 'Test workflow' WHERE NOT EXISTS (SELECT 1 FROM workflow_definition WHERE workflow_definition.id = 1);
INSERT INTO project_workflow_definition (project_id, workflow_definition_id) SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM project_workflow_definition WHERE project_workflow_definition.project_id = 1 AND project_workflow_definition.workflow_definition_id = 1);
INSERT INTO service (id, name) SELECT 1, 'test service' WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 1);
INSERT INTO workflow_definition_service (id, workflow_definition_id, service_id, created_at, updated_at) SELECT 1, 1, 1, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 1);
INSERT INTO service_param (id, service_id, key, value) SELECT 1, 1, 'key', 'valye' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 1);
INSERT INTO service_param (id, service_id, key, value) SELECT 2, 1, 'key1', 'valye1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 2);
INSERT INTO workflow_definition_service_param_value (id, workflow_definition_service_id, service_param_id) SELECT 1, 1, 1 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 1);
INSERT INTO workflow_definition_service_param_value (id, workflow_definition_service_id, service_param_id) SELECT 2, 1, 2 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 2);
INSERT INTO workflow (id, project_id, workflow_definition_id) SELECT 1, 1, 1 WHERE NOT EXISTS (SELECT 1 FROM workflow WHERE workflow.id = 1);
INSERT INTO workflow_service (id, service_id, workflow_id) SELECT 1, 1, 1 WHERE NOT EXISTS (SELECT 1 FROM workflow_service WHERE workflow_service.id = 1);
INSERT INTO workflow_service_param_value (id, workflow_service_id, service_param_id, value) SELECT 1, 1, 1, 'ababaab' WHERE NOT EXISTS (SELECT 1 FROM workflow_service_param_value  WHERE workflow_service_param_value.id = 1);
INSERT INTO workflow_service_param_value (id, workflow_service_id, service_param_id, value) SELECT 2, 1, 2, 'xxwsdds' WHERE NOT EXISTS (SELECT 1 FROM workflow_service_param_value  WHERE workflow_service_param_value.id = 2);



