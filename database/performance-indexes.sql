-- Performance-Optimierungen für Raspberry Pi 3
-- Datenbank-Indizes für häufige Queries

-- Posts: Indizes für häufige Filterungen
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_dates ON posts(start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_priority ON posts(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_organization ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_composite ON posts(is_active, start_date, end_date, priority DESC) WHERE is_active = true;

-- Categories: Indizes für Lookups
CREATE INDEX IF NOT EXISTS idx_categories_organization ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Users: Indizes für Authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Media: Indizes für Uploads
CREATE INDEX IF NOT EXISTS idx_media_organization ON media(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);

-- Sessions: Index für Cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- VACUUM und ANALYZE für optimale Performance
VACUUM ANALYZE posts;
VACUUM ANALYZE categories;
VACUUM ANALYZE users;
VACUUM ANALYZE media;

-- PostgreSQL Tuning für Raspberry Pi 3 (1GB RAM)
-- Diese Einstellungen können in postgresql.conf gesetzt werden:
-- 
-- shared_buffers = 128MB          (1/8 des RAMs)
-- effective_cache_size = 512MB    (1/2 des RAMs)
-- maintenance_work_mem = 64MB
-- work_mem = 4MB
-- max_connections = 20            (Reduziert für RPi3)
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1          (Für SD-Karte optimiert)
-- effective_io_concurrency = 200
-- min_wal_size = 1GB
-- max_wal_size = 2GB
