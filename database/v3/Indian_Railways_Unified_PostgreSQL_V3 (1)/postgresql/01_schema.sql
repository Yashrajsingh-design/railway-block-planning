-- PostgreSQL schema for SIH26027 V3
SET TIME ZONE 'Asia/Kolkata';

CREATE TABLE IF NOT EXISTS "zones" (
    "zone_id" TEXT,
    "zone_name" TEXT
);

CREATE TABLE IF NOT EXISTS "divisions" (
    "division_id" TEXT,
    "zone_id" TEXT,
    "division_name" TEXT
);

CREATE TABLE IF NOT EXISTS "departments" (
    "department_id" TEXT,
    "department_name" TEXT,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "stations" (
    "station_id" TEXT,
    "division_id" TEXT,
    "section_id" TEXT,
    "station_name" TEXT
);

CREATE TABLE IF NOT EXISTS "sections" (
    "section_id" TEXT,
    "division_id" TEXT,
    "from_station_id" TEXT,
    "to_station_id" TEXT,
    "route_name" TEXT,
    "track_count" INTEGER,
    "electrified" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "locations" (
    "location_id" TEXT,
    "section_id" TEXT,
    "km_from_origin" TEXT
);

CREATE TABLE IF NOT EXISTS "assets" (
    "asset_id" TEXT,
    "department_id" TEXT,
    "section_id" TEXT,
    "location_id" TEXT,
    "asset_type_code" TEXT,
    "asset_type_name" TEXT,
    "installation_date" DATE,
    "status" TEXT,
    "criticality_score" INTEGER
);

CREATE TABLE IF NOT EXISTS "resources" (
    "resource_id" TEXT,
    "resource_name" TEXT,
    "department_id" TEXT,
    "resource_type" TEXT
);

CREATE TABLE IF NOT EXISTS "resource_availability" (
    "availability_id" TEXT,
    "resource_id" TEXT,
    "date" DATE,
    "start_time" TIME,
    "end_time" TIME,
    "is_available" BOOLEAN,
    "capacity" INTEGER
);

CREATE TABLE IF NOT EXISTS "inspections" (
    "inspection_id" TEXT,
    "asset_id" TEXT,
    "department_id" TEXT,
    "inspection_date" DATE,
    "result" TEXT,
    "condition_score" INTEGER,
    "inspection_type" TEXT
);

CREATE TABLE IF NOT EXISTS "defects" (
    "defect_id" TEXT,
    "asset_id" TEXT,
    "section_id" TEXT,
    "found_date" DATE,
    "severity" TEXT,
    "defect_type" TEXT,
    "due_date" DATE,
    "status" TEXT
);

CREATE TABLE IF NOT EXISTS "maintenance_tasks" (
    "task_id" TEXT,
    "asset_id" TEXT,
    "department_id" TEXT,
    "section_id" TEXT,
    "task_type" TEXT,
    "defect_id" TEXT,
    "due_date" DATE,
    "estimated_duration_min" INTEGER,
    "priority_score" NUMERIC(8,2),
    "status" TEXT,
    "preferred_window" TEXT,
    "power_block_required" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "task_dependencies" (
    "dependency_id" TEXT,
    "predecessor_task_id" TEXT,
    "successor_task_id" TEXT,
    "dependency_type" TEXT,
    "reason" TEXT
);

CREATE TABLE IF NOT EXISTS "train_events" (
    "train_event_id" TEXT,
    "train_type" TEXT,
    "service_date" DATE,
    "entry_time" TIME,
    "exit_time" TIME,
    "section_id" TEXT,
    "operational_priority" INTEGER,
    "is_forecast" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "goods_forecast" (
    "forecast_id" TEXT,
    "forecast_date" DATE,
    "section_id" TEXT,
    "expected_goods_trains" INTEGER,
    "confidence" NUMERIC(8,2),
    "traffic_level" TEXT
);

CREATE TABLE IF NOT EXISTS "coa_windows" (
    "window_id" TEXT,
    "section_id" TEXT,
    "date" DATE,
    "start_time" TIME,
    "end_time" TIME,
    "duration_min" INTEGER,
    "block_type" TEXT,
    "status" TEXT,
    "window_class" TEXT
);

CREATE TABLE IF NOT EXISTS "restrictions" (
    "restriction_id" TEXT,
    "section_id" TEXT,
    "date" DATE,
    "restriction_type" TEXT,
    "restriction_code" TEXT,
    "severity" TEXT,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "block_requests" (
    "block_request_id" TEXT,
    "department_id" TEXT,
    "task_id" TEXT,
    "section_id" TEXT,
    "requested_date" DATE,
    "preferred_start" TEXT,
    "preferred_end" TEXT,
    "minimum_duration_min" INTEGER,
    "block_type" TEXT,
    "request_status" TEXT,
    "priority_score" NUMERIC(8,2),
    "authorization_status" TEXT,
    "work_description" TEXT,
    "power_block_required" BOOLEAN,
    "bundling_candidate" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "bundling_candidates" (
    "bundle_id" TEXT,
    "task_id_a" TEXT,
    "task_id_b" TEXT,
    "bundle_rule" TEXT,
    "reason" TEXT
);

CREATE TABLE IF NOT EXISTS "scenarios" (
    "scenario_id" TEXT,
    "scenario_name" TEXT,
    "description" TEXT,
    "train_conflict_weight" TEXT,
    "maintenance_priority_weight" TEXT,
    "resource_capacity_factor" TEXT
);

CREATE TABLE IF NOT EXISTS "baseline_assignments" (
    "assignment_id" TEXT,
    "scenario_id" TEXT,
    "block_request_id" TEXT,
    "window_id" TEXT,
    "assignment_method" TEXT,
    "assigned_date" DATE,
    "assigned_start" TEXT,
    "assigned_end" TEXT,
    "assignment_status" TEXT,
    "conflict_count" TEXT
);

CREATE TABLE IF NOT EXISTS "plan_metrics" (
    "scenario_id" TEXT,
    "metric_name" TEXT,
    "target_value" TEXT,
    "unit" TEXT,
    "direction" TEXT
);

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_department') THEN ALTER TABLE assets ADD CONSTRAINT fk_assets_department FOREIGN KEY (department_id) REFERENCES departments(department_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_section') THEN ALTER TABLE assets ADD CONSTRAINT fk_assets_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resources_department') THEN ALTER TABLE resources ADD CONSTRAINT fk_resources_department FOREIGN KEY (department_id) REFERENCES departments(department_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ra_resource') THEN ALTER TABLE resource_availability ADD CONSTRAINT fk_ra_resource FOREIGN KEY (resource_id) REFERENCES resources(resource_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inspections_asset') THEN ALTER TABLE inspections ADD CONSTRAINT fk_inspections_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inspections_department') THEN ALTER TABLE inspections ADD CONSTRAINT fk_inspections_department FOREIGN KEY (department_id) REFERENCES departments(department_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_defects_asset') THEN ALTER TABLE defects ADD CONSTRAINT fk_defects_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_defects_section') THEN ALTER TABLE defects ADD CONSTRAINT fk_defects_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_asset') THEN ALTER TABLE maintenance_tasks ADD CONSTRAINT fk_tasks_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_department') THEN ALTER TABLE maintenance_tasks ADD CONSTRAINT fk_tasks_department FOREIGN KEY (department_id) REFERENCES departments(department_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_section') THEN ALTER TABLE maintenance_tasks ADD CONSTRAINT fk_tasks_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dep_pred') THEN ALTER TABLE task_dependencies ADD CONSTRAINT fk_dep_pred FOREIGN KEY (predecessor_task_id) REFERENCES maintenance_tasks(task_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dep_succ') THEN ALTER TABLE task_dependencies ADD CONSTRAINT fk_dep_succ FOREIGN KEY (successor_task_id) REFERENCES maintenance_tasks(task_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_train_section') THEN ALTER TABLE train_events ADD CONSTRAINT fk_train_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_goods_section') THEN ALTER TABLE goods_forecast ADD CONSTRAINT fk_goods_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_windows_section') THEN ALTER TABLE coa_windows ADD CONSTRAINT fk_windows_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_restrictions_section') THEN ALTER TABLE restrictions ADD CONSTRAINT fk_restrictions_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_requests_department') THEN ALTER TABLE block_requests ADD CONSTRAINT fk_requests_department FOREIGN KEY (department_id) REFERENCES departments(department_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_requests_task') THEN ALTER TABLE block_requests ADD CONSTRAINT fk_requests_task FOREIGN KEY (task_id) REFERENCES maintenance_tasks(task_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_requests_section') THEN ALTER TABLE block_requests ADD CONSTRAINT fk_requests_section FOREIGN KEY (section_id) REFERENCES sections(section_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_baseline_scenario') THEN ALTER TABLE baseline_assignments ADD CONSTRAINT fk_baseline_scenario FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_baseline_request') THEN ALTER TABLE baseline_assignments ADD CONSTRAINT fk_baseline_request FOREIGN KEY (block_request_id) REFERENCES block_requests(block_request_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_baseline_window') THEN ALTER TABLE baseline_assignments ADD CONSTRAINT fk_baseline_window FOREIGN KEY (window_id) REFERENCES coa_windows(window_id); END IF; END $$;


CREATE INDEX IF NOT EXISTS idx_assets_section ON assets(section_id);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section_due ON maintenance_tasks(section_id,due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON maintenance_tasks(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_defects_asset_severity ON defects(asset_id,severity);
CREATE INDEX IF NOT EXISTS idx_train_section_time ON train_events(section_id,service_date,entry_time);
CREATE INDEX IF NOT EXISTS idx_goods_section_date ON goods_forecast(section_id,forecast_date);
CREATE INDEX IF NOT EXISTS idx_windows_section_date ON coa_windows(section_id,date,start_time);
CREATE INDEX IF NOT EXISTS idx_requests_section_date ON block_requests(section_id,requested_date);
CREATE INDEX IF NOT EXISTS idx_requests_status ON block_requests(request_status);



CREATE OR REPLACE VIEW optimizer_candidate_input AS
SELECT br.block_request_id, br.department_id, br.task_id, br.section_id,
       br.requested_date, br.minimum_duration_min, br.block_type, br.priority_score,
       cw.window_id, cw.date AS window_date, cw.start_time, cw.end_time,
       cw.duration_min, cw.window_class,
       t.task_type, t.due_date, t.power_block_required,
       a.asset_id, a.asset_type_code, a.criticality_score
FROM block_requests br
JOIN coa_windows cw
  ON br.section_id=cw.section_id AND br.requested_date=cw.date
JOIN maintenance_tasks t ON br.task_id=t.task_id
JOIN assets a ON t.asset_id=a.asset_id;

CREATE OR REPLACE VIEW maintenance_priority_input AS
SELECT t.task_id,t.asset_id,t.section_id,t.department_id,t.task_type,
       t.due_date,t.estimated_duration_min,t.priority_score,
       t.status,t.power_block_required,
       a.asset_type_code,a.criticality_score,
       d.severity AS open_defect_severity
FROM maintenance_tasks t
JOIN assets a ON t.asset_id=a.asset_id
LEFT JOIN defects d ON t.defect_id=d.defect_id AND d.status='OPEN';
