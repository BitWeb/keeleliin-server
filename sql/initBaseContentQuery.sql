INSERT INTO resource_type (value, name, split_type) SELECT 'text', 'Tekst', 'LINE' WHERE NOT EXISTS (SELECT 1 FROM resource_type WHERE resource_type.id = 1);

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
