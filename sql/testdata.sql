INSERT INTO resource_type (value, name, split_type) SELECT 'TEXT', 'Tekst', 'LINE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 1);
INSERT INTO resource_type (value, name, split_type) SELECT 'ZIP', 'Zip-file', 'NONE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 2);

INSERT INTO "user" (entu_id, email, name, created_at, updated_at) SELECT 1, 'taivo@bitweb.ee', 'taivo', now(), now() WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'taivo@bitweb.ee');
INSERT INTO "user" (entu_id, email, name, created_at, updated_at) SELECT 2, 'priit@bitweb.ee', 'priit', now(), now() WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'priit@bitweb.ee');

INSERT INTO service (name, url, created_at, updated_at) SELECT 'Lausestaja', 'http://dev.bitweb.ee:3001/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 1);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Morfoloogiline analüüs', 'http://dev.bitweb.ee:3002/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 2);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Osalausestaja', 'http://dev.bitweb.ee:3003/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 3);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Morfoloogiline ühestamine (kitsenduste grammatika)', 'http://dev.bitweb.ee:3004/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 4);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Pindsüntaktiline analüüs', 'http://dev.bitweb.ee:3005/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 5);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Sõltuvussüntaktiline analüüs (ja järeltöötlus)', 'http://dev.bitweb.ee:3006/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 6);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Arhiivi lahtipakkija', 'http://dev.bitweb.ee:3007/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 7);
INSERT INTO service (name, url, created_at, updated_at) SELECT 'Sõnestaja', 'http://dev.bitweb.ee:3008/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 8);

INSERT INTO service_param (service_id, key, value) SELECT 1, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 1);
INSERT INTO service_param (service_id, key, value) SELECT 2, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 2);
INSERT INTO service_param (service_id, key, value) SELECT 3, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 3);
INSERT INTO service_param (service_id, key, value) SELECT 4, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 4);
INSERT INTO service_param (service_id, key, value) SELECT 5, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 5);
INSERT INTO service_param (service_id, key, value) SELECT 6, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 6);
INSERT INTO service_param (service_id, key, value) SELECT 7, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 7);
INSERT INTO service_param (service_id, key, value) SELECT 8, 'is_async', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 8);

INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 1, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 1);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 2, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 2);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 3, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 3);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 4, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 4);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 5, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 5);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 6, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 6);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 7, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 7);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 8, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 8);

INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 1);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 2, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 2);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 3, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 3);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 4, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 4);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 5, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 5);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 6, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 6);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 7, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 7);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 8, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 8);

INSERT INTO project (name, description, user_id, created_at, updated_at) SELECT 'test project', 'test project', 1, now(), now() WHERE NOT EXISTS (SELECT 1 FROM project WHERE project.name = 'test project');
INSERT INTO workflow_definition (project_id, user_id, name, description) SELECT 1, 1, 'Test workflow', 'Test workflow' WHERE NOT EXISTS (SELECT 1 FROM workflow_definition WHERE workflow_definition.id = 1);
INSERT INTO project_workflow_definition (project_id, workflow_definition_id, created_at, updated_at) SELECT 1, 1, now(), now() WHERE NOT EXISTS (SELECT 1 FROM project_workflow_definition WHERE project_workflow_definition.project_id = 1 AND project_workflow_definition.workflow_definition_id = 1);

INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 1, 0, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 1);
INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 2, 1, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 2);
INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 3, 2, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 3);
INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 4, 3, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 4);
INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 5, 4, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 5);
INSERT INTO workflow_definition_service (workflow_definition_id, service_id, order_num, created_at, updated_at)
SELECT 1, 6, 5, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition_service WHERE workflow_definition_service.id = 6);

INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 1, 1 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 1);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 2, 2 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 2);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 3, 3 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 3);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 4, 4 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 4);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 5, 5 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 5);
INSERT INTO workflow_definition_service_param_value (workflow_definition_service_id, service_param_id) SELECT 6, 6 WHERE NOT EXISTS (
SELECT 1 FROM workflow_definition_service_param_value WHERE workflow_definition_service_param_value.id = 6);

INSERT INTO "user" (entu_id, email, name, created_at, updated_at) SELECT 3, 'taivo.teder@gmail.com', 'taivo1', now(), now() WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'taivo.teder@gmail.com');