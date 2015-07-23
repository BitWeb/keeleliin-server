INSERT INTO resource_type(value, name, split_type) VALUES ('TEXT', 'Tekst', 'LINE');
INSERT INTO resource_type(value, name, split_type) VALUES ('WORD', 'Sõnad', 'LINE');

INSERT INTO resource(
            file_type, resource_type_id, source_original_name,
            source_filename, filename, name)
    VALUES ('FILE', 1, 'name',
    'name', 'name', 'name');
INSERT INTO resource(
            file_type, resource_type_id, source_original_name,
            source_filename, filename, name)
    VALUES ('FILE', 1, 'name2',
    'name2', 'name2', 'name2');


INSERT INTO "user" (entu_id, email, name) SELECT 1, 'taivo@bitweb.ee', 'taivo' WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'taivo@bitweb.ee');
INSERT INTO project (name, description, user_id) SELECT 'test project', 'test project', 1 WHERE NOT EXISTS (SELECT 1 FROM project WHERE project.name = 'test project');
INSERT INTO workflow_definition (project_id, name, description) SELECT 1, 'Test workflow', 'Test workflow' WHERE NOT EXISTS (SELECT 1 FROM workflow_definition WHERE workflow_definition.id = 1);
INSERT INTO project_workflow_definition (project_id, workflow_definition_id) SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM project_workflow_definition WHERE project_workflow_definition.project_id = 1 AND project_workflow_definition.workflow_definition_id = 1);

INSERT INTO service (name, url) SELECT 'sõnestaja', 'http://dev.bitweb.ee:3002/api/v1/' WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 1);
INSERT INTO service (name, url) SELECT 'morfühestaja', 'http://dev.bitweb.ee:3003/api/v1/' WHERE NOT EXISTS (SELECT 2 FROM service WHERE service.id = 2);

INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 1, 0, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 1);
INSERT INTO service_param (service_id, key, value) SELECT 1, 'key', 'valye' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 1);
INSERT INTO service_param (service_id, key, value) SELECT 2, 'key1', 'valye1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 2);
INSERT INTO service_param (service_id, key, value) SELECT 1, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 3);
INSERT INTO service_param (service_id, key, value) SELECT 2, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 4);

INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 1, 1 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 1);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 1, 2 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 2);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 1, 3 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 3);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 1, 4 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 4);

INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 2, 1, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 2);

INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 2, 1 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 1);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 2, 2 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 2);

INSERT INTO workflow (project_id, workflow_definition_id) SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM workflow WHERE workflow.id = 1);
INSERT INTO workflow_service (service_id, workflow_id) SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM workflow_service WHERE workflow_service.id = 1);
INSERT INTO workflow_service_param_value (workflow_service_id, service_param_id, value) SELECT 1, 1, 'ababaab' WHERE NOT EXISTS (SELECT 1 FROM workflow_service_param_value  WHERE workflow_service_param_value.id = 1);
INSERT INTO workflow_service_param_value (workflow_service_id, service_param_id, value) SELECT 1, 2, 'xxwsdds' WHERE NOT EXISTS (SELECT 1 FROM workflow_service_param_value  WHERE workflow_service_param_value.id = 2);

INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) VALUES ('content', TRUE, 1, 1, 4, 'piece');
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) VALUES ('content', TRUE, 2, 1, 10, 'byte');

INSERT INTO service_output_type(key, service_id, resource_type_id) VALUES ('output', 1, 1);
INSERT INTO service_output_type(key, service_id, resource_type_id) VALUES ('output', 2, 1);
