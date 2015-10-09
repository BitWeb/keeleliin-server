
INSERT INTO resource_type (value, name, split_type) SELECT 'text', 'Tekst', 'LINE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 1);
INSERT INTO resource_type (value, name, split_type) SELECT 'zip', 'Zip-file', 'NONE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 2);

INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'lau', 'Lausestaja', 'http://dev.bitweb.ee:3001/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 1);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'moa', 'Morfoloogiline analüüs', 'http://dev.bitweb.ee:3002/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 2);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'osl', 'Osalausestaja', 'http://dev.bitweb.ee:3003/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 3);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'moy', 'Morfoloogiline ühestamine (kitsenduste grammatika)', 'http://dev.bitweb.ee:3004/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 4);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'pia', 'Pindsüntaktiline analüüs', 'http://dev.bitweb.ee:3005/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 5);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 's6a', 'Sõltuvussüntaktiline analüüs (ja järeltöötlus)', 'http://dev.bitweb.ee:3006/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 6);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'uzip', 'Arhiivi lahtipakkija', 'http://dev.bitweb.ee:3007/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 7);
INSERT INTO service (sid, name, url, created_at, updated_at) SELECT 'tok', 'Sõnestaja pipe', 'http://dev.bitweb.ee:3008/api/v1/', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 8);
INSERT INTO service (sid, name, url, created_at, updated_at, is_synchronous) SELECT 'concat', 'Sünkroonne teksti konkateneerija', 'http://dev.bitweb.ee:3009/api/v1/', now(), now(), TRUE
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 9);
INSERT INTO service (sid, name, url, created_at, updated_at, is_synchronous) SELECT 'moyp', 'Morfoloogiline ühestaja pipe', 'http://dev.bitweb.ee:3010/api/v1/', now(), now(), TRUE
    WHERE NOT EXISTS (SELECT 1 FROM service WHERE service.id = 10);

INSERT INTO service_param (service_id, key, value) SELECT 1, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 1);
INSERT INTO service_param (service_id, key, value) SELECT 2, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 2);
INSERT INTO service_param (service_id, key, value) SELECT 3, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 3);
INSERT INTO service_param (service_id, key, value) SELECT 4, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 4);
INSERT INTO service_param (service_id, key, value) SELECT 5, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 5);
INSERT INTO service_param (service_id, key, value) SELECT 6, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 6);
INSERT INTO service_param (service_id, key, value) SELECT 7, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 7);
INSERT INTO service_param (service_id, key, value) SELECT 8, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 8);
INSERT INTO service_param (service_id, key, value) SELECT 9, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 9);
INSERT INTO service_param (service_id, key, value) SELECT 10, 'isAsync', '1' WHERE NOT EXISTS (SELECT 1 FROM service_param WHERE service_param.id = 10);

INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 1, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 1);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 2, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 2);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 3, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 3);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 4, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 4);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 5, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 5);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 6, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 6);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 7, 2, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 7);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 8, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 8);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit, is_list) SELECT 'content', FALSE, 9, 1, 0, 'byte', TRUE WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 9);
INSERT INTO service_input_type(key, do_parallel, service_id, resource_type_id, size_limit, size_unit) SELECT 'content', FALSE, 10, 1, 0, 'byte' WHERE NOT EXISTS (SELECT 1 FROM service_input_type WHERE service_input_type.id = 10);

INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 1);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 2, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 2);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 3, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 3);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 4, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 4);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 5, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 5);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 6, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 6);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 7, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 7);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 8, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 8);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 9, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 9);
INSERT INTO service_output_type(key, service_id, resource_type_id) SELECT 'output', 10, 1 WHERE NOT EXISTS (SELECT 1 FROM service_output_type WHERE service_output_type.id = 10);

INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 2, 1, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 2 AND  service_parent_id = 1);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 3, 2, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 3 AND  service_parent_id = 2);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 4, 3, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 4 AND  service_parent_id = 3);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 5, 4, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 5 AND  service_parent_id = 4);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 6, 5, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 6 AND  service_parent_id = 5);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 1, 7, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 1 AND  service_parent_id = 7);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 8, 7, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 8 AND  service_parent_id = 7);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 9, 7, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 9 AND  service_parent_id = 7);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 10, 8, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 10 AND  service_parent_id = 8);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 8, 9, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 8 AND  service_parent_id = 9);
INSERT INTO service_has_parent_service(service_sibling_id, service_parent_id, created_at, updated_at) SELECT 1, 9, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM service_has_parent_service WHERE service_sibling_id = 1 AND  service_parent_id = 9);


INSERT INTO notification_type ( application_context, code, url_template, message_template, is_send_email, mail_subject_template, notify_period_days )
SELECT
    'workflow',
    'workflow-finished',
    '{appUrl}/#/project/{projectId}/workflow/{workflowId}',
    'Töövoog "{workflowName}" lõpetas',
    TRUE,
    'Töövoog "{workflowName}"lõpetas',
    0
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-finished');

INSERT INTO notification_type ( application_context, code, url_template, message_template, is_send_email, mail_subject_template, notify_period_days )
SELECT
    'project',
    'project-user-added',
    '{appUrl}/#/project/{projectId}',
    'Sinuga on jagatud projekti "{projectName}"',
    TRUE,
    'Sinuga on jagatud projekti',
    0
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'project-user-added');

INSERT INTO notification_type ( application_context, code, url_template, message_template, is_send_email, mail_subject_template, notify_period_days )
SELECT
    'workflow',
    'workflow-error',
    '{appUrl}/#/project/{projectId}/workflow/{workflowId}',
    'Töövoos "{workflowName}" tekkis viga',
    TRUE,
    'Töövoos "{workflowName}" tekkis viga',
    0
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-error');

INSERT INTO notification_type ( application_context, code, url_template, message_template, is_send_email, mail_subject_template, notify_period_days )
SELECT
    'workflow',
    'workflow-still-running',
    '{appUrl}/#/project/{projectId}/workflow/{workflowId}',
    'Töövoog "{workflowName}" jookseb endiselt',
    TRUE,
    'Töövoog "{workflowName}" jookseb endiselt',
    0
WHERE NOT EXISTS (SELECT 1 FROM notification_type WHERE notification_type.code = 'workflow-still-running');
