-- Post-load validation
SELECT 'departments' table_name, COUNT(*) row_count FROM departments
UNION ALL SELECT 'sections',COUNT(*) FROM sections
UNION ALL SELECT 'assets',COUNT(*) FROM assets
UNION ALL SELECT 'maintenance_tasks',COUNT(*) FROM maintenance_tasks
UNION ALL SELECT 'block_requests',COUNT(*) FROM block_requests
UNION ALL SELECT 'train_events',COUNT(*) FROM train_events
UNION ALL SELECT 'coa_windows',COUNT(*) FROM coa_windows;

SELECT COUNT(*) AS orphan_tasks
FROM maintenance_tasks t LEFT JOIN assets a ON a.asset_id=t.asset_id
WHERE a.asset_id IS NULL;

SELECT COUNT(*) AS orphan_requests
FROM block_requests br LEFT JOIN maintenance_tasks t ON t.task_id=br.task_id
WHERE t.task_id IS NULL;
