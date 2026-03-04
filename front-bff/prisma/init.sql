-- Create OSS tables in cloudhawk database
CREATE TABLE IF NOT EXISTS oss_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    uid TEXT UNIQUE NOT NULL,
    org_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oss_subusers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES oss_users(id),
    subuser TEXT NOT NULL,
    access TEXT NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, subuser)
);

CREATE TABLE IF NOT EXISTS oss_buckets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL REFERENCES oss_users(id),
    size DOUBLE PRECISION NOT NULL DEFAULT 0,
    object_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, owner_id)
);

CREATE TABLE IF NOT EXISTS oss_bucket_policies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bucket_id TEXT NOT NULL REFERENCES oss_buckets(id) ON DELETE CASCADE,
    principal TEXT NOT NULL,
    actions TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bucket_id, principal)
);

CREATE TABLE IF NOT EXISTS oss_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES oss_users(id),
    subuser TEXT,
    access_key TEXT UNIQUE NOT NULL,
    secret_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
