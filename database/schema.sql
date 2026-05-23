CREATE TABLE IF NOT EXISTS vps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  ssh_port INTEGER NOT NULL DEFAULT 22,
  ssh_user TEXT NOT NULL,
  detected_os TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_successful_connection_at TEXT
);

CREATE TABLE IF NOT EXISTS deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  vps_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  target_path TEXT,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  framework TEXT NOT NULL DEFAULT 'react-vite',
  build_command TEXT NOT NULL DEFAULT 'npm run build',
  output_folder TEXT NOT NULL DEFAULT 'dist',
  duration_seconds INTEGER,
  FOREIGN KEY (vps_id) REFERENCES vps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_id INTEGER,
  vps_id INTEGER,
  type TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE SET NULL,
  FOREIGN KEY (vps_id) REFERENCES vps(id) ON DELETE SET NULL
);