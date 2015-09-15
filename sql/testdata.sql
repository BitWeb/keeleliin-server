INSERT INTO resource_type (value, name, split_type) SELECT 'text', 'Tekst', 'LINE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 1);
INSERT INTO resource_type (value, name, split_type) SELECT 'zip', 'Zip-file', 'NONE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 2);

INSERT INTO "user" (entu_id, email, name, created_at, updated_at) SELECT 1, 'taivo@bitweb.ee', 'taivo', now(), now() WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'taivo@bitweb.ee');
INSERT INTO "user" (entu_id, email, name, created_at, updated_at) SELECT 2, 'priit@bitweb.ee', 'priit', now(), now() WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user".email = 'priit@bitweb.ee');

INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'lau', 'Lausestaja', 'http://dev.bitweb.ee:3001/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'lau');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'moa', 'Morfoloogiline analüüs', 'http://dev.bitweb.ee:3002/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'moa');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'osl', 'Osalausestaja', 'http://dev.bitweb.ee:3003/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'osl');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'moy', 'Morfoloogiline ühestamine (kitsenduste grammatika)', 'http://dev.bitweb.ee:3004/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'moy');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'pia', 'Pindsüntaktiline analüüs', 'http://dev.bitweb.ee:3005/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'pia');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 's6a', 'Sõltuvussüntaktiline analüüs (ja järeltöötlus)', 'http://dev.bitweb.ee:3006/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 's6a');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'uzip', 'Arhiivi lahtipakkija', 'http://dev.bitweb.ee:3007/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'uzip');
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'tok', 'Sõnestaja pipe', 'http://dev.bitweb.ee:3008/api/v1/', now(), now() WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'tok');
INSERT INTO service (sid, name, url, created_at, updated_at, is_synchronous) SELECT 'loco-test', 'LOCO test', 'http://localhost:3001/api/v1/', now(), now(), TRUE WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.sid = 'loco-test');

INSERT INTO service_param (service_id, key, value) SELECT 1, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 1);
INSERT INTO service_param (service_id, key, value) SELECT 2, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 2);
INSERT INTO service_param (service_id, key, value) SELECT 3, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 3);
INSERT INTO service_param (service_id, key, value) SELECT 4, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 4);
INSERT INTO service_param (service_id, key, value) SELECT 5, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 5);
INSERT INTO service_param (service_id, key, value) SELECT 6, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 6);
INSERT INTO service_param (service_id, key, value) SELECT 7, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 7);
INSERT INTO service_param (service_id, key, value) SELECT 8, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 8);
INSERT INTO service_param (service_id, key, value) SELECT 9, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 9);

INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 1, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 1);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 2, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 2);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 3, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 3);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 4, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 4);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 5, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 5);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 6, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 6);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 7, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 7);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 8, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 8);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit, is_list) SELECT 'content', FALSE, 9, 1, 0, 'byte', TRUE WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 9);

INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 1);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 2, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 2);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 3, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 3);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 4, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 4);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 5, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 5);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 6, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 6);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 7, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 7);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 8, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 8);

INSERT INTO project (name, description, user_id, created_at, updated_at) SELECT 'test project', 'test project', 1, now(), now() WHERE NOT EXISTS (SELECT 1 FROM project WHERE project.name = 'test project');
INSERT INTO workflow_definition (project_id, user_id, name, description, created_at, updated_at) SELECT 1, 1, 'Test workflow', 'Test workflow', now() , now() WHERE NOT EXISTS (SELECT 1 FROM workflow_definition WHERE workflow_definition.id = 1);
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

INSERT INTO notification_type (url_template, application_context, message, is_send_email, code, notify_period_days, mail_subject, mail_template)
SELECT 'http://someurl/id/{id}', 'workflow', 'Töövoog lõppes', TRUE, 'workflow-finished', 0, 'Töövoog lõppes', '<p>Vaata töövoogu <a href="{url}">siit</a>.</p>'
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-finished');

INSERT INTO notification_type (url_template, application_context, message, is_send_email, code, notify_period_days, mail_subject, mail_template)
SELECT 'http://someurl/id/{id}', 'project', 'Sinuga on jagatud projekti', TRUE, 'project-user-added', 0, 'Sinuga on jagatud projekti', '<p>Vaata projekti <a href="{url}">siit</a>.</p>'
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'project-user-added');

INSERT INTO notification_type (url_template, application_context, message, is_send_email, code, notify_period_days, mail_subject, mail_template)
SELECT 'http://someurl/id/{id}', 'workflow', 'Töövoo viga', TRUE, 'workflow-error', 0,
'Töövoo viga', '<p>Vaata töövoogu <a href="{url}">siit</a>.</p>'
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-error');

INSERT INTO notification_type (url_template, application_context, message, is_send_email, code, notify_period_days, mail_subject, mail_template)
SELECT 'http://someurl/id/{id}', 'workflow', 'Töövoog jookseb endiselt', TRUE, 'workflow-still-running', 7, 'Töövoog jookseb endiselt', '<p>Vaata töövoogu <a href="{url}">siit</a>.</p>'
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-still-running');

INSERT INTO project_user (user_id, project_id, role)
SELECT 1, 1, 'owner' WHERE NOT EXISTS (SELECT 1 FROM project_user WHERE project_user.user_id = 1 AND project_user.project_id = 1);

